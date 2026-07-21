export const locales = {
  en: {
    nav: {
      dailyGm: '📡 Daily GM',
      nodes: '🔬 Nodes',
      ranking: '📊 Leaderboard',
      network: '🌐 Network',
    },
    header: {
      connect: '🔗 Connect',
      disconnect: 'Disconnect'
    },
    hero: {
      title: 'Signal 0xL',
      desc: 'On-chain signaling platform for Arc Testnet. Leave your daily mark, track your commitment, and climb the leaderboard.',
      connectBtn: '🔗 Connect Wallet',
      networkInfo: 'Network: Arc Testnet · Chain ID: 5042002'
    },
    dashboard: {
      yourSignal: '👤 Your Signal',
      loadingContract: 'Loading contract data...',
      dailyGmTitle: '📡 Daily Signal',
      dailyGmDesc: 'Send your daily signal to Arc Testnet. The window is 00:00–23:59 UTC. Each GM grants +1 point (or +2 with active Runestone).',
      btnGmDisabled: '🔗 Connect your wallet to start',
      btnGmActive: '🚀 Send Signal (GM)',
      btnGmDone: '✅ GM Sent Today',
      btnSuperGm: '🔮 SUPER GM (Runestone)',
      btnGmFirst: '📡 Send First Signal (GM)',
      btnGmNormal: '📡 Send Signal (GM)',
      fundTitle: '🌉 Fund USDC (Unified Balance)',
      fundDesc: 'Deposit USDC from external networks and spend it instantly on Arc Testnet without manual bridges, powered by Circle App Kit. <strong>Currently awaiting official CCTP deployment on Arc Testnet.</strong>',
      btnFundBase: 'Deposit from Base (Coming Soon)',
      btnFundArb: 'Deposit from Arb (Coming Soon)',
      btnBridgeArc: 'Bring funds to Arc (Coming Soon)',
      agentTitle: '🤖 AI Agent (ERC-8004)',
      agentDesc: 'Upon activating your Runestone (3 nodes), you can attach an AI Agent (registered in IdentityRegistry) to prove your adoption of the Arc Agentic Economy.',
      agentEmpty: 'Connect your wallet and activate the Runestone to manage your agent.',
      statStatus: 'Status',
      statStreak: 'Streak',
      statPoints: 'Score',
      statGms: 'GMs Sent',
      statCost: 'Current GM Cost',
      statRunestone: 'Runestone',
      active: 'Active',
      inactive: 'Inactive',
      debt: 'debt',
      forkInfo: 'You are on fork <strong>B{fork}</strong>. Your GM costs slightly more, but activating nodes <strong>only costs the base fee</strong>.',
      btnResetVip: 'Reset to VIP',
      agentActiveDesc: 'Your AI Agent is active and attached to your Signal 0xL profile.',
      agentPermission: 'Runestone activated! You are authorized to attach your Agent. Make sure it is registered in the <a href="https://testnet.arcscan.app/address/0x8004A818BFB912233c491871b3d84c89A494BD9e" target="_blank" style="color: var(--color-primary);">Arc IdentityRegistry</a> first.',
      agentReqRunestone: '❌ You must activate the Runestone (3 nodes) to interact with AI agents.',
      agentSearching: '⏳ Searching for your agents on Arc Testnet...',
      agentNoneFound: 'You do not have any Agent registered in this wallet.',
      agentRegisterBtn: 'Register an Agent (Arc)',
      agentOption: 'Agent #{id}',
      agentSelectPlaceholder: 'Select your Agent',
      agentSelectWarning: 'Select an Agent from the list.',
      agentAttaching: 'Attaching...',
      agentSearchError: '❌ Error searching for agents on the network.'
    },
    nodes: {
      title: '🔬 Analysis Nodes',
      runestoneInactive: '○ Runestone inactive — Activate all 3 nodes',
      runestoneActive: '🔥 RUNESTONE ACTIVE 🔥 (+2 pts per GM)',
      node1: {
        title: 'Node 1 — Commitment',
        desc: 'Analyzes historical transaction volume and gas spent on Arc Testnet. Calculates your activity tier and score multiplier.',
        req: 'Requires day 3 streak',
        instantBtn: '⚡ Instant Activation (0.51 USDC)',
        streakBtn: '🔥 Activate via Streak'
      },
      node2: {
        title: 'Node 2 — Conviction',
        desc: 'Calculates the percentage of the total native USDC supply held in your wallet. Measures your economic weight on the network.',
        req: 'Requires day 12 streak',
        instantBtn: '⚡ Instant Activation (1.26 USDC)',
        streakBtn: '🔥 Activate via Streak'
      },
      node3: {
        title: 'Node 3 — Legacy',
        desc: 'Analyzes the timestamp of your first and last transaction on Arc Testnet. The older you are on the network, the higher your legacy multiplier.',
        req: 'Requires day 25 streak',
        instantBtn: '⚡ Instant Activation (5.01 USDC)',
        streakBtn: '🔥 Activate via Streak'
      },
      btnLoad: '📊 Load Node Data (from Blockscout)',
      loadWarning: 'Consumes ~60 API credits. Results cached for 1 hour.',
      loadingData: 'Load data to analyze.',
      howItWorksTitle: 'ℹ️ How nodes work',
      howItWorksLines: [
        '• <strong style="color: var(--color-text);">VIP (B1):</strong> Activate via streak (free except 0.01 base) or paying a premium instant fee.',
        '• <strong style="color: var(--color-fork);">Fork B2+:</strong> No premium fees. Activate nodes instantly or via streak paying only the base cost.',
        '• <strong style="color: var(--color-runestone);">Runestone:</strong> Activates automatically when holding all 3 nodes. Doubles your GM points.',
        '• If you lose your streak, nodes deactivate and must be reactivated.'
      ]
    },
    ranking: {
      title: '📊 Signal Leaderboard',
      desc: 'The leaderboard is sorted by <strong style="color: var(--color-text);">total accumulated score</strong>, not by active streak. Any wallet can be TOP 1 with enough points, regardless of its fork.',
      loading: '⏳ Loading leaderboard...',
      updateBtn: '🔄 Refresh',
      noData: 'No signals on the network yet. Be the first to GM!',
      registered: 'registered signalers'
    },
    network: {
      title: '🌐 Network Analysis — Arc Testnet',
      desc: 'Real-time metrics fetched from Blockscout PRO API. Auto-updates every 30 seconds with a 2-minute local cache.',
      loading: '⏳ Connecting to Arc Testnet...',
      blockSpeed: 'Block Speed',
      avgTime: 'avg time',
      avgGas: 'Avg Gas',
      totalBlocks: 'Total Blocks',
      inArcTestnet: 'in Arc Testnet',
      txToday: 'TXs Today',
      transactions: 'transactions',
      utilization: 'Network Utilization',
      gasTiers: 'Gas (Slow / Avg / Fast)',
      inGwei: 'in Gwei',
      updated: 'Updated: {time}',
      source: 'Source: Blockscout PRO API · Refreshes every {sec}s',
      error: '⚠️ Failed to load network metrics.',
      retry: 'Retry'
    },
    footer: {
      explorer: 'Explorer',
    },
    js: {
      connectFirst: 'Please connect your wallet first.',
      gmSent: 'Signal sent successfully!',
      error: 'Error:',
      loading: 'Loading...',
      userStatus: 'You are on Fork B{fork} • {pts} Pts • Streak {streak}',
      attachedAgent: 'Attached Agent: #{id}',
      attachAgentBtn: '🔗 Attach AI Agent',
      attachAgentPrompt: 'Enter the Token ID (ERC-8004) of your Agent:',
      invalidAgentId: 'Invalid Token ID.',
      agentAttachedMsg: 'Agent attached successfully!',
      nodeActivatedMsg: 'Node {id} activated successfully!',
      insufficientFunds: 'Insufficient funds for the transaction.',
      userRejected: 'Transaction rejected by user.',
      nodeDataLoaded: 'Analysis completed.',
      legacyTiers: ['Genesis (Day 1)', 'Founder (Week 1)', 'Pioneer (Month 1)', 'Veteran (Q1)', 'Active'],
      commitmentTiers: ['Beginner', 'Active', 'Committed', 'Veteran', 'Elite'],
      rankingHeaders: ['Rank', 'Address', 'Score', 'Fork'],
      rankingNoData: 'No users found.',
      networkBlocks: 'Blocks Processed',
      networkTx: 'Total Txs',
      networkAddresses: 'Active Wallets',
      networkGas: 'Avg Gas Price',
      node1Data: ['Total Transactions', 'Gas Consumed', 'Fees Paid', 'Tier'],
      node2Data: ['Native Balance', '% of Supply', 'Total Supply (ref.)', 'Classification'],
      node3Data: ['First TX', 'Last TX', 'Days since Genesis', 'Active Range', 'Badge'],
      node3Empty: 'No transactions found on Arc Testnet.',
      you: 'You'
    }
  },
  es: {
    nav: {
      dailyGm: '📡 GM Diario',
      nodes: '🔬 Nodos',
      ranking: '📊 Ranking',
      network: '🌐 Red',
    },
    header: {
      connect: '🔗 Conectar',
      disconnect: 'Cerrar Sesión'
    },
    hero: {
      title: 'Signal 0xL',
      desc: 'Plataforma de señales en cadena para Arc Testnet. Deja tu huella diaria, analiza tu compromiso y escala en el ranking.',
      connectBtn: '🔗 Conectar Wallet',
      networkInfo: 'Red: Arc Testnet · Chain ID: 5042002'
    },
    dashboard: {
      yourSignal: '👤 Tu Señal',
      loadingContract: 'Cargando datos del contrato...',
      dailyGmTitle: '📡 Señal Diaria',
      dailyGmDesc: 'Envía tu señal diaria a Arc Testnet. La ventana es 00:00–23:59 UTC. Cada GM suma +1 punto (o +2 con Runestone activo).',
      btnGmDisabled: '🔗 Conecta tu wallet para empezar',
      btnGmActive: '🚀 Enviar Señal (GM)',
      btnGmDone: '✅ GM Enviado Hoy',
      btnSuperGm: '🔮 SUPER GM (Runestone)',
      btnGmFirst: '📡 Enviar Primera Señal (GM)',
      btnGmNormal: '📡 Enviar Señal (GM)',
      fundTitle: '🌉 Fondear USDC (Unified Balance)',
      fundDesc: 'Deposita USDC desde redes externas y gástalo instantáneamente en Arc Testnet sin puentes manuales, impulsado por Circle App Kit. <strong>Actualmente a la espera del despliegue oficial de CCTP en Arc Testnet.</strong>',
      btnFundBase: 'Depositar desde Base (Próximamente)',
      btnFundArb: 'Depositar desde Arb (Próximamente)',
      btnBridgeArc: 'Traer fondos a Arc (Próximamente)',
      agentTitle: '🤖 Agente de IA (ERC-8004)',
      agentDesc: 'Al activar tu Runestone (3 nodos), puedes vincular un Agente de IA (registrado en IdentityRegistry) para demostrar tu adopción de la Agentic Economy de Arc.',
      agentEmpty: 'Conecta tu wallet y activa el Runestone para gestionar tu agente.',
      statStatus: 'Estado',
      statStreak: 'Streak',
      statPoints: 'Score',
      statGms: 'GMs Realizados',
      statCost: 'Costo GM Actual',
      statRunestone: 'Runestone',
      active: 'Activo',
      inactive: 'Inactivo',
      debt: 'deuda',
      forkInfo: 'Estás en bifurcación <strong>B{fork}</strong>. Tu GM cuesta un poco más, pero activar nodos <strong>solo cuesta la tarifa base</strong>.',
      btnResetVip: 'Resetear a VIP',
      agentActiveDesc: 'Tu Agente de IA está activo y conectado a tu perfil en Signal 0xL.',
      agentPermission: '¡Runestone activado! Tienes permiso para vincular tu Agente. Asegúrate de haberlo registrado primero en el <a href="https://testnet.arcscan.app/address/0x8004A818BFB912233c491871b3d84c89A494BD9e" target="_blank" style="color: var(--color-primary);">IdentityRegistry de Arc</a>.',
      agentReqRunestone: '❌ Debes activar el Runestone (3 nodos) para interactuar con agentes de IA.',
      agentSearching: '⏳ Buscando tus agentes en Arc Testnet...',
      agentNoneFound: 'No tienes ningún Agente registrado en esta wallet.',
      agentRegisterBtn: 'Registrar un Agente (Arc)',
      agentOption: 'Agente #{id}',
      agentSelectPlaceholder: 'Selecciona tu Agente',
      agentSelectWarning: 'Selecciona un Agente de la lista.',
      agentAttaching: 'Vinculando...',
      agentSearchError: '❌ Error al buscar agentes en la red.'
    },
    nodes: {
      title: '🔬 Nodos de Análisis',
      runestoneInactive: '○ Runestone inactivo — Activa los 3 nodos',
      runestoneActive: '🔥 RUNESTONE ACTIVO 🔥 (+2 pts por GM)',
      node1: {
        title: 'Nodo 1 — Compromiso',
        desc: 'Analiza el volumen histórico de transacciones y gas consumido en Arc Testnet. Calcula tu tier de actividad y su multiplicador de puntaje.',
        req: 'Requiere racha día 3',
        instantBtn: '⚡ Activar Ahora (0.51 USDC)',
        streakBtn: '🔥 Activar por Racha'
      },
      node2: {
        title: 'Nodo 2 — Convicción',
        desc: 'Calcula el porcentaje del supply total de USDC nativo que posee tu wallet. Mide tu peso económico en la red.',
        req: 'Requiere racha día 12',
        instantBtn: '⚡ Activar Ahora (1.26 USDC)',
        streakBtn: '🔥 Activar por Racha'
      },
      node3: {
        title: 'Nodo 3 — Legado',
        desc: 'Analiza el timestamp de tu primera y última transacción en Arc Testnet. Cuanto más antiguo seas en la red, mayor será tu multiplicador de legado.',
        req: 'Requiere racha día 25',
        instantBtn: '⚡ Activar Ahora (5.01 USDC)',
        streakBtn: '🔥 Activar por Racha'
      },
      btnLoad: '📊 Cargar Datos de Nodos (desde Blockscout)',
      loadWarning: 'Consume ~60 créditos API. Resultado se cachea 1 hora.',
      loadingData: 'Carga los datos para analizar.',
      howItWorksTitle: 'ℹ️ Cómo funcionan los nodos',
      howItWorksLines: [
        '• <strong style="color: var(--color-text);">VIP (B1):</strong> Activa por racha (gratis excepto 0.01 base) o pagando tarifa premium al instante.',
        '• <strong style="color: var(--color-fork);">Bifurcación B2+:</strong> Sin tarifas premium. Activas nodos instantáneamente o por racha pagando solo el costo base.',
        '• <strong style="color: var(--color-runestone);">Runestone:</strong> Se activa automáticamente al tener los 3 nodos. Duplica tus puntos por GM.',
        '• Si pierdes la racha, los nodos se desactivan y debes reactivarlos.'
      ]
    },
    ranking: {
      title: '📊 Tabla de Señales',
      desc: 'El ranking está ordenado por <strong style="color: var(--color-text);">puntaje acumulado total</strong>, no por racha activa. Cualquier wallet puede ser TOP 1 con suficientes puntos, independientemente de su bifurcación.',
      loading: '⏳ Cargando ranking...',
      updateBtn: '🔄 Actualizar',
      noData: 'Aún no hay señales en la red. ¡Sé el primero en hacer GM!',
      registered: 'señaladores registrados'
    },
    network: {
      title: '🌐 Análisis de Red — Arc Testnet',
      desc: 'Métricas en tiempo real obtenidas desde Blockscout PRO API. Se actualiza automáticamente cada 30 segundos con caché local de 2 minutos.',
      loading: '⏳ Conectando con Arc Testnet...',
      blockSpeed: 'Velocidad de Bloque',
      avgTime: 'tiempo promedio',
      avgGas: 'Gas Promedio',
      totalBlocks: 'Bloques Totales',
      inArcTestnet: 'en Arc Testnet',
      txToday: 'TXs Hoy',
      transactions: 'transacciones',
      utilization: 'Utilización de Red',
      gasTiers: 'Gas (Lento / Medio / Rápido)',
      inGwei: 'en Gwei',
      updated: 'Actualizado: {time}',
      source: 'Fuente: Blockscout PRO API · Refresca cada {sec}s',
      error: '⚠️ No se pudieron cargar las métricas de red.',
      retry: 'Reintentar'
    },
    footer: {
      explorer: 'Explorador',
    },
    js: {
      connectFirst: 'Conecta tu wallet primero.',
      gmSent: '¡Señal enviada exitosamente!',
      error: 'Error:',
      loading: 'Cargando...',
      userStatus: 'Estás en Bifurcación B{fork} • {pts} Pts • Racha {streak}',
      attachedAgent: 'Agente Vinculado: #{id}',
      attachAgentBtn: '🔗 Vincular Agente IA',
      attachAgentPrompt: 'Ingresa el Token ID (ERC-8004) de tu Agente:',
      invalidAgentId: 'Token ID inválido.',
      agentAttachedMsg: '¡Agente vinculado exitosamente!',
      nodeActivatedMsg: '¡Nodo {id} activado exitosamente!',
      insufficientFunds: 'Fondos insuficientes para la transacción.',
      userRejected: 'Transacción rechazada por el usuario.',
      nodeDataLoaded: 'Análisis completado.',
      legacyTiers: ['Génesis (Día 1)', 'Fundador (1ª Semana)', 'Pionero (1er Mes)', 'Veterano (1er Trim.)', 'Activo'],
      commitmentTiers: ['Iniciante', 'Activo', 'Comprometido', 'Veterano', 'Élite'],
      rankingHeaders: ['Posición', 'Dirección', 'Puntaje', 'Bifurcación'],
      rankingNoData: 'No hay usuarios.',
      networkBlocks: 'Bloques Procesados',
      networkTx: 'Transacciones Totales',
      networkAddresses: 'Wallets Activas',
      networkGas: 'Gas Promedio',
      node1Data: ['Transacciones totales', 'Gas consumido', 'Fees pagadas', 'Tier'],
      node2Data: ['Balance nativo', '% del supply', 'Supply total (ref.)', 'Clasificación'],
      node3Data: ['Primera TX', 'Última TX', 'Días desde génesis', 'Rango activo', 'Insignia'],
      node3Empty: 'No se encontraron transacciones en Arc Testnet.',
      you: 'Tú'
    }
  }
};

let currentLang = localStorage.getItem('signal_lang') || 'en';

export function setLanguage(lang) {
  if (locales[lang]) {
    currentLang = lang;
    localStorage.setItem('signal_lang', lang);
    applyTranslations();
  }
}

export function getLanguage() {
  return currentLang;
}

export function t(key, params = {}) {
  const keys = key.split('.');
  let value = locales[currentLang];
  for (const k of keys) {
    if (value === undefined) break;
    value = value[k];
  }
  if (value === undefined) return key;

  if (typeof value === 'string') {
    return value.replace(/{(\w+)}/g, (_, match) => params[match] !== undefined ? params[match] : `{${match}}`);
  }
  return value;
}

export function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key);
    
    // Si es un atributo placeholder
    if (el.hasAttribute('placeholder') && !el.textContent.trim()) {
      el.setAttribute('placeholder', translation);
    } 
    // Si es un contenido HTML complejo o array (ej. how it works lines)
    else if (Array.isArray(translation)) {
      el.innerHTML = translation.map(line => `<p>${line}</p>`).join('');
    }
    else {
      // Evitar sobreescribir html anidado si el dev usó data-i18n-html
      if (el.hasAttribute('data-i18n-html')) {
        el.innerHTML = translation;
      } else {
        el.textContent = translation;
      }
    }
  });
  
  // Custom dispatcher para que los modulos re-rendericen lo necesario
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: currentLang }));
}

export function initI18n() {
  applyTranslations();
}
