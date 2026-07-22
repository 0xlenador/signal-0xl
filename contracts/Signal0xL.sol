// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IIdentityRegistry {
    function ownerOf(uint256 tokenId) external view returns (address);
}

/**
 * @title Signal0xL
 * @notice dApp de señales diarias (GM) en Arc Testnet.
 * @dev Moneda nativa USDC (18 decimales). baseGMCost = 0.01 USDC = 1e16 wei.
 *
 * FLUJO PRINCIPAL:
 *  - doGM()                  → GM diario. Calcula costo según bifurcación + deuda.
 *  - activateNodeInstant(id) → Activa nodo pagando tarifa instantánea.
 *  - activateNodeByStreak(id)→ Activa nodo al alcanzar racha mínima.
 *  - resetToVIP()            → Resetea racha y vuelve a B1 (VIP). Desactiva nodos.
 *
 * COSTOS (con baseGMCost = 0.01 USD):
 *  - B1 (VIP):  0.01 USD / GM
 *  - B[n]:      0.01 + (n-1) * 0.005 USD / GM
 *  - Nodo 1 instant (B1): 0.51 USD  (50x + 1x base)
 *  - Nodo 2 instant (B1): 1.26 USD  (125x + 1x base)
 *  - Nodo 3 instant (B1): 5.01 USD  (500x + 1x base)
 *  - Bifurcación B2+: nodos cuestan solo la tarifa base (0.01 USD) al instante o por racha.
 *
 * PUNTOS:
 *  - GM normal:   +1 punto
 *  - Super GM:    +2 puntos (Runestone = los 3 nodos activos)
 */
contract Signal0xL {

    // ─────────────────────────────────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────────────────────────────────

    address public owner;

    /// @notice Costo base del GM: 0.01 USD en wei (18 decimals → 1e16).
    uint256 public baseGMCost = 1e16;

    struct UserData {
        uint256 totalPoints;     // Puntaje acumulado total (incluye bonos Runestone)
        uint256 lastGmDay;       // Último día UTC en que hizo GM (timestamp / 86400)
        uint256 currentStreak;   // Racha activa (días consecutivos)
        uint256 forkLevel;       // Nivel de bifurcación: 1=VIP, 2=B2, 3=B3...
        uint256 gmCount;         // Contador total de GMs realizados
        bool nodeCommitment;     // Nodo 1 activo
        bool nodeConviction;     // Nodo 2 activo
        bool nodeLegacy;         // Nodo 3 activo
        bool exists;             // Flag de registro
        uint256 attachedAgentId; // ID del agente AI vinculado
    }

    mapping(address => UserData) public users;
    address[] public userList;
    
    // Dirección del ERC-8004 Identity Registry en Arc Testnet
    address public identityRegistry = 0x8004A818BFB912233c491871b3d84c89A494BD9e;

    // ─────────────────────────────────────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────────────────────────────────────

    event GMDone(
        address indexed user,
        uint256 pointsEarned,
        uint256 totalPoints,
        uint256 streak,
        uint256 forkLevel,
        bool superGM
    );
    event NodeActivated(address indexed user, uint8 nodeId, bool byStreak);
    event StreakReset(address indexed user);
    event BaseCostUpdated(uint256 newCost);
    event Withdrawn(address indexed to, uint256 amount);
    event AgentAttached(address indexed user, uint256 agentId);

    // ─────────────────────────────────────────────────────────────────────────
    // MODIFIERS
    // ─────────────────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Signal: not owner");
        _;
    }

    modifier onlyRegistered() {
        require(users[msg.sender].exists, "Signal: do GM first to register");
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONSTRUCTOR
    // ─────────────────────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        // baseGMCost default: 0.01 USDC = 1e16 wei (18 decimals, 1:1 USD)
        // Si la red usa 6 decimals: deployer llama setBaseGMCost(1e4) post-deploy.
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTERNAL HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Día UTC actual (segundos desde epoch / segundos en un día)
    function _currentDay() internal view returns (uint256) {
        return block.timestamp / 86400;
    }

    /// @dev Costo GM según nivel de bifurcación.
    ///      B[n] = baseGMCost + (n-1) * (baseGMCost / 2)
    ///      Ejemplo: B1=0.01, B2=0.015, B3=0.02, B4=0.025...
    function _gmCostForFork(uint256 forkLevel) internal view returns (uint256) {
        if (forkLevel <= 1) return baseGMCost;
        // (n-1) * 0.005 USD = (n-1) * baseGMCost/2
        return baseGMCost + ((forkLevel - 1) * baseGMCost / 2);
    }

    /// @dev Activa un nodo por id (1,2,3).
    function _activateNode(address user, uint8 nodeId) internal {
        if (nodeId == 1) users[user].nodeCommitment = true;
        else if (nodeId == 2) users[user].nodeConviction = true;
        else users[user].nodeLegacy = true;
    }

    /// @dev Comprueba si el nodo ya está activo.
    function _nodeActive(address user, uint8 nodeId) internal view returns (bool) {
        if (nodeId == 1) return users[user].nodeCommitment;
        if (nodeId == 2) return users[user].nodeConviction;
        return users[user].nodeLegacy;
    }

    /// @dev Helper para enviar ETH/USDC nativo de forma segura en Arc (previene envío a 0x0)
    function _safeTransferEth(address to, uint256 amount) internal {
        require(to != address(0), "Signal: Arc EVM forbids zero address transfers");
        (bool ok, ) = payable(to).call{value: amount}("");
        require(ok, "Signal: native token transfer failed");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WRITE FUNCTIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Realiza el GM diario.
     * @dev El valor enviado debe cubrir: costGM + deudaDíasPerdidos.
     *      Si el usuario no existe, lo registra automáticamente.
     *      Si se rompió la racha, incrementa forkLevel y desactiva nodos.
     *      Devuelve el exceso de pago al sender.
     */
    function doGM() external payable {
        uint256 today = _currentDay();
        UserData storage u = users[msg.sender];

        // ── Primer GM: registrar usuario
        if (!u.exists) {
            u.exists = true;
            u.forkLevel = 1;
            userList.push(msg.sender);
        }

        require(u.lastGmDay != today, "Signal: already GM'd today (UTC)");

        uint256 missedDays = 0;

        // ── Detectar si se rompió la racha (>1 día sin GM)
        if (u.lastGmDay > 0 && today > u.lastGmDay + 1) {
            missedDays = today - u.lastGmDay - 1;
            u.forkLevel += 1;        // Sube un nivel de bifurcación
            u.currentStreak = 0;     // Reinicia racha
            // Los nodos se desactivan al perder racha
            u.nodeCommitment = false;
            u.nodeConviction = false;
            u.nodeLegacy = false;
        }

        // ── Calcular costos
        uint256 gmCost = _gmCostForFork(u.forkLevel);
        uint256 debtCost = missedDays * baseGMCost;
        uint256 totalRequired = gmCost + debtCost;

        require(msg.value >= totalRequired, "Signal: insufficient payment");

        // ── Actualizar estado
        u.lastGmDay = today;
        u.currentStreak += 1;
        u.gmCount += 1;

        // ── Calcular puntos (Super GM si Runestone activo)
        bool superGM = u.nodeCommitment && u.nodeConviction && u.nodeLegacy;
        uint256 pointsEarned = superGM ? 2 : 1;
        u.totalPoints += pointsEarned;

        // ── Devolver exceso
        if (msg.value > totalRequired) {
            _safeTransferEth(msg.sender, msg.value - totalRequired);
        }

        emit GMDone(msg.sender, pointsEarned, u.totalPoints, u.currentStreak, u.forkLevel, superGM);
    }

    /**
     * @notice Activa un nodo pagando la tarifa instantánea.
     * @param nodeId 1=Compromiso, 2=Convicción, 3=Legado.
     * @dev Usuarios en bifurcación (B2+) activan gratis.
     *      Usuarios VIP (B1) pagan: N1=0.51, N2=1.26, N3=5.01 USD.
     */
    function activateNodeInstant(uint8 nodeId) external payable onlyRegistered {
        require(nodeId >= 1 && nodeId <= 3, "Signal: invalid node id");
        require(!_nodeActive(msg.sender, nodeId), "Signal: node already active");

        UserData storage u = users[msg.sender];
        uint256 cost = baseGMCost; // B2+ paga el costo base

        // Solo B1 (VIP) paga la tarifa instantánea premium
        if (u.forkLevel <= 1) {
            if (nodeId == 1) cost = 51 * baseGMCost;       // 0.50 + 0.01 = 0.51 USD
            else if (nodeId == 2) cost = 126 * baseGMCost; // 1.25 + 0.01 = 1.26 USD
            else cost = 501 * baseGMCost;                  // 5.00 + 0.01 = 5.01 USD
        }

        require(msg.value >= cost, "Signal: insufficient payment for node");

        _activateNode(msg.sender, nodeId);

        if (msg.value > cost) {
            _safeTransferEth(msg.sender, msg.value - cost);
        }

        emit NodeActivated(msg.sender, nodeId, false);
    }

    /**
     * @notice Activa un nodo al alcanzar la racha mínima requerida.
     * @param nodeId 1=Compromiso(día 3), 2=Convicción(día 12), 3=Legado(día 25).
     * @dev Usuarios B1 pagan baseGMCost (0.01 USD) como costo base.
     *      Usuarios B2+ activan completamente gratis.
     */
    function activateNodeByStreak(uint8 nodeId) external payable onlyRegistered {
        require(nodeId >= 1 && nodeId <= 3, "Signal: invalid node id");
        require(!_nodeActive(msg.sender, nodeId), "Signal: node already active");

        UserData storage u = users[msg.sender];

        uint256 requiredStreak;
        if (nodeId == 1) requiredStreak = 3;
        else if (nodeId == 2) requiredStreak = 12;
        else requiredStreak = 25;

        require(u.currentStreak >= requiredStreak, "Signal: streak too low");

        // Todos los usuarios pagan el costo base al activar por racha
        uint256 cost = baseGMCost;
        require(msg.value >= cost, "Signal: insufficient payment");

        _activateNode(msg.sender, nodeId);

        if (msg.value > cost) {
            _safeTransferEth(msg.sender, msg.value - cost);
        }

        emit NodeActivated(msg.sender, nodeId, true);
    }

    /**
     * @notice Resetea bifurcación a B1 (VIP). Reinicia racha y desactiva nodos.
     * @dev Útil para usuarios que prefieren mantener el estatus VIP y el menor
     *      costo de GM en lugar de conservar una bifurcación alta.
     */
    function resetToVIP() external onlyRegistered {
        UserData storage u = users[msg.sender];
        require(u.forkLevel > 1, "Signal: already VIP");

        u.forkLevel = 1;
        u.currentStreak = 0;
        u.nodeCommitment = false;
        u.nodeConviction = false;
        u.nodeLegacy = false;

        emit StreakReset(msg.sender);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AGENT ECONOMY (ERC-8004)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Vincula un agente de IA (ERC-8004) al perfil del usuario.
     * @dev Requiere que el usuario posea el Runestone (los 3 nodos activos).
     * @param agentId El ID del token NFT en IdentityRegistry.
     */
    function attachAgent(uint256 agentId) external onlyRegistered {
        UserData storage u = users[msg.sender];
        require(u.nodeCommitment && u.nodeConviction && u.nodeLegacy, "Signal: Runestone required");
        
        // Verificar que el usuario sea el owner del agente
        address agentOwner = IIdentityRegistry(identityRegistry).ownerOf(agentId);
        require(agentOwner == msg.sender, "Signal: not agent owner");

        u.attachedAgentId = agentId;
        emit AgentAttached(msg.sender, agentId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // READ FUNCTIONS
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Datos completos de un usuario.
    function getUserData(address _user) external view returns (
        uint256 totalPoints,
        uint256 lastGmDay,
        uint256 currentStreak,
        uint256 forkLevel,
        uint256 gmCount,
        bool nodeCommitment,
        bool nodeConviction,
        bool nodeLegacy,
        bool exists,
        uint256 attachedAgentId
    ) {
        UserData storage u = users[_user];
        return (
            u.totalPoints,
            u.lastGmDay,
            u.currentStreak,
            u.forkLevel == 0 ? 1 : u.forkLevel,
            u.gmCount,
            u.nodeCommitment,
            u.nodeConviction,
            u.nodeLegacy,
            u.exists,
            u.attachedAgentId
        );
    }

    /// @notice Costo actual del GM y deuda acumulada para un usuario.
    function getGMCost(address _user) external view returns (uint256 gmCost, uint256 debtCost) {
        UserData storage u = users[_user];
        uint256 today = _currentDay();
        uint256 fork = u.forkLevel == 0 ? 1 : u.forkLevel;
        gmCost = _gmCostForFork(fork);
        if (u.lastGmDay > 0 && today > u.lastGmDay + 1) {
            uint256 missed = today - u.lastGmDay - 1;
            debtCost = missed * baseGMCost;
        }
    }

    /// @notice Costo de activar un nodo al instante para un usuario.
    function getNodeInstantCost(uint8 nodeId, address _user) external view returns (uint256) {
        if (users[_user].forkLevel > 1) return baseGMCost; // B2+ paga costo base
        if (nodeId == 1) return 51 * baseGMCost;
        if (nodeId == 2) return 126 * baseGMCost;
        if (nodeId == 3) return 501 * baseGMCost;
        return baseGMCost;
    }

    /// @notice Retorna una lista paginada de usuarios (sin ordenar, para no exceder gas).
    function getUsersPaginated(uint256 offset, uint256 limit) external view returns (
        address[] memory addrs,
        uint256[] memory points,
        uint256[] memory forks
    ) {
        uint256 total = userList.length;
        if (offset >= total) {
            return (new address[](0), new uint256[](0), new uint256[](0));
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        uint256 resultCount = end - offset;

        addrs  = new address[](resultCount);
        points = new uint256[](resultCount);
        forks  = new uint256[](resultCount);

        for (uint256 i = 0; i < resultCount; i++) {
            address userAddr = userList[offset + i];
            addrs[i]  = userAddr;
            points[i] = users[userAddr].totalPoints;
            uint256 fl = users[userAddr].forkLevel;
            forks[i]  = fl == 0 ? 1 : fl;
        }
    }

    /// @notice Verifica si el usuario ya hizo GM hoy (UTC).
    function hasGMToday(address _user) external view returns (bool) {
        return users[_user].lastGmDay == _currentDay();
    }

    /// @notice Verifica si el usuario puede activar un nodo por racha.
    function canActivateByStreak(uint8 nodeId, address _user) external view returns (bool) {
        UserData storage u = users[_user];
        if (!u.exists) return false;
        if (_nodeActive(_user, nodeId)) return false;
        if (nodeId == 1) return u.currentStreak >= 3;
        if (nodeId == 2) return u.currentStreak >= 12;
        if (nodeId == 3) return u.currentStreak >= 25;
        return false;
    }

    /// @notice Retorna true si el usuario tiene Runestone (Super GM) activo.
    function hasRunestone(address _user) external view returns (bool) {
        UserData storage u = users[_user];
        return u.nodeCommitment && u.nodeConviction && u.nodeLegacy;
    }

    /// @notice Día UTC actual del bloque.
    function getCurrentUTCDay() external view returns (uint256) {
        return _currentDay();
    }

    /// @notice Días transcurridos desde el último GM del usuario.
    function getDaysSinceLastGM(address _user) external view returns (uint256) {
        UserData storage u = users[_user];
        if (!u.exists || u.lastGmDay == 0) return 0;
        uint256 today = _currentDay();
        return today > u.lastGmDay ? today - u.lastGmDay : 0;
    }

    /// @notice Cantidad total de usuarios registrados.
    function getUserCount() external view returns (uint256) {
        return userList.length;
    }

    /**
     * @notice Retorna las top `count` wallets por puntaje.
     * @dev Bubble sort in-memory. No optimizado para listas grandes.
     *      Para MVP es suficiente con hasta ~200 usuarios.
     */
    function getTopUsers(uint256 count) external view returns (
        address[] memory addrs,
        uint256[] memory points,
        uint256[] memory forks
    ) {
        uint256 total = userList.length;
        uint256 resultCount = count > total ? total : count;

        // Copia local para ordenar
        address[] memory sorted = new address[](total);
        for (uint256 i = 0; i < total; i++) {
            sorted[i] = userList[i];
        }

        // Bubble sort descendente por puntos
        for (uint256 i = 0; i < total; i++) {
            for (uint256 j = i + 1; j < total; j++) {
                if (users[sorted[j]].totalPoints > users[sorted[i]].totalPoints) {
                    address tmp = sorted[i];
                    sorted[i] = sorted[j];
                    sorted[j] = tmp;
                }
            }
        }

        addrs  = new address[](resultCount);
        points = new uint256[](resultCount);
        forks  = new uint256[](resultCount);

        for (uint256 i = 0; i < resultCount; i++) {
            addrs[i]  = sorted[i];
            points[i] = users[sorted[i]].totalPoints;
            uint256 fl = users[sorted[i]].forkLevel;
            forks[i]  = fl == 0 ? 1 : fl;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN FUNCTIONS
    // ─────────────────────────────────────────────────────────────────────────
    
    /// @notice Permite actualizar la dirección del registro de Agentes (ERC-8004).
    function setIdentityRegistry(address _registry) external onlyOwner {
        require(_registry != address(0), "Signal: invalid registry");
        identityRegistry = _registry;
    }

    /// @notice Actualiza el costo base del GM (permite ajustar la paridad USD→nativo).
    function setBaseGMCost(uint256 _newCost) external onlyOwner {
        require(_newCost > 0, "Signal: cost must be > 0");
        baseGMCost = _newCost;
        emit BaseCostUpdated(_newCost);
    }

    /// @notice Retira los fondos acumulados en el contrato al owner.
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Signal: no funds");
        _safeTransferEth(owner, balance);
        emit Withdrawn(owner, balance);
    }

    /// @notice Permite recibir USDC nativo directamente.
    receive() external payable {}
}
