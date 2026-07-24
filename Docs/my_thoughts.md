# 📖 La Biblia Arquitectónica de Signal 0xL

> **La premisa:** Signal 0xL es un juego de constancia y supervivencia económica. Piensa en el Smart Contract como un juez implacable que solo entiende de reglas y dinero. Piensa en el Frontend (tu aplicación en Next.js) como el anfitrión amable que le traduce esas reglas al usuario, analiza sus datos y lo protege de cometer errores.

---

## 1. El GM Diario (The Daily Signal)

**El Concepto:** Entras una vez al día, presionas "GM", pagas un centavo (0.01 USDC) y ganas un punto. Tu racha sube.

### ¿Cómo funciona detrás de escena?

* **En el Frontend (Next.js):** El protagonista aquí es el reloj UTC. La interfaz no mira la hora de Colombia ni de España; tiene una cuenta regresiva sincronizada a la medianoche UTC. La UI se la pasa preguntándole al contrato (leyendo `hasGMToday`): "¿Este usuario ya hizo GM hoy?". Si la respuesta es sí, Next.js apaga visualmente el botón de GM para que el usuario no gaste gas intentando algo que va a fallar.
* **En la Blockchain (Smart Contract):** Cuando el usuario presiona "GM", se envía una transacción ejecutando `doGM()`. El contrato mira el reloj del bloque en la red. Si nunca habías interactuado, el contrato te registra mágicamente (sin pedirte llenar formularios), te nombra VIP (Bifurcación 1) y te cobra tus 0.01 USDC. Tu huella queda inmortalizada on-chain.

---

## 2. El Látigo: Castigos, Bifurcaciones y Deudas

**El Concepto:** Si olvidas hacer GM, pierdes tu racha, tus nodos se apagan, subes de nivel de penalización (Bifurcación 2, 3...) y quedas endeudado. El contrato te cobrará los días que faltaste.

### ¿Cómo funciona detrás de escena?

* **En el Frontend (Next.js):** ¡Aquí la UI debe ser un salvavidas! Antes de que el usuario presione GM, el frontend llama a la función de lectura `getGMCost()`. Así, Next.js sabe exactamente que el usuario debe, por ejemplo, 2 días. La UI dibuja una "factura" bonita: "Costo de GM B2 ($0.015) + Deuda de inactividad ($0.02)". Así, cuando MetaMask se abre, el usuario no se asusta al ver un cobro mayor al habitual y no rechaza la transacción.
* **En la Blockchain (Smart Contract):** El contrato es frío. Cuando ejecutas `doGM()` tras una ausencia, hace las matemáticas: "Hoy es el día 10, viniste el día 7... Faltaste 2 días enteros". Al instante, el contrato resetea tu racha a 0, apaga tus nodos satélite (`false`), te sube un nivel de bifurcación, y se cobra la deuda exacta antes de dejarte sumar tu punto de hoy.

---

## 3. El Botón de Pánico: Reset a VIP (resetToVIP)

**El Concepto:** Si tu nivel de Bifurcación es muy alto (ej. B10) y el GM diario ya te cuesta una fortuna de gas, puedes presionar este botón para volver a ser VIP (B1). Pero a cambio, sacrificas cualquier racha o nodo que tuvieras activo.

### ¿Cómo funciona detrás de escena?

* **En la Blockchain (Smart Contract):** Ejecutar `resetToVIP()` es una transacción que le cuesta $0 USDC al usuario (solo paga el gas de la red). El contrato simplemente cambia tu perfil: te pone `forkLevel = 1`, `currentStreak = 0` y apaga tus nodos. No te cobra deudas ni registra tu GM del día.
* **En el Frontend (Next.js):** El frontend debe mostrar este botón solo si el usuario ha caído en desgracia (Bifurcación > 1). Pero debe ser muy claro con un texto: "Al resetear, volverás a B1. Sin embargo, cuando hagas tu GM de hoy, el sistema te cobrará tu deuda pendiente y te ubicará en B2". Es una jugada estratégica para evitar pagar un GM nivel B11.

---

## 4. Los Nodos Satélite y La Piedra Rúnica (La Gran Magia Analítica)

**El Concepto:** Existen tres nodos. Nodo 1 (Compromiso: analiza tu gas histórico), Nodo 2 (Convicción: analiza tus tokens) y Nodo 3 (Legado: analiza tu antigüedad en la red). Si activas los tres, formas la Runestone y ganas +2 puntos por GM en lugar de +1. Si pierdes la racha, se apagan.

### ¿Cómo funciona detrás de escena? (Aquí es donde mejor se separan las responsabilidades)

* **En la Blockchain (Smart Contract):** ¡Sorpresa! El contrato inteligente no sabe nada de análisis de gas, tokens ni historiales. Para el contrato, los nodos son simples interruptores de luz (Falso o Verdadero). Si alcanzas la racha (ej. 3 días) o pagas la cuota de ballena, el contrato simplemente voltea el interruptor a "Verdadero" (`nodeCommitment = true`). Y si los tres interruptores están en Verdadero, el contrato te da 2 puntos en tu próximo GM. Eso es todo.
* **En el Frontend y RPC (Next.js):** ¡Aquí está el verdadero cerebro analítico! Cuando tu aplicación web ve que tienes un interruptor en "Verdadero", desbloquea esa sección en la pantalla. Luego, Next.js usa APIs e indexadores (RPC) de Arc Testnet para leer todo el historial de la wallet, calcular cuánto gas has gastado, revisar tus tokens y buscar en qué bloque hiciste tu primera transacción. Los multiplicadores, insignias históricas y gráficos viven 100% en la interfaz visual, premiando al usuario.
* **Asimetría de Precios en la UI:** El frontend tiene una regla visual clave. Si lee que el usuario es VIP, muestra que comprar los nodos al instante cuesta caro ($0.51, $1.26, $5.01). Pero si lee que el usuario está castigado (B2 en adelante), tacha esos precios y le dice: "Como beneficio oculto, puedes activarlos por solo $0.01". El contrato respalda esto cobrando solo un centavo en esos casos.

---

## 5. El Décimo Campo: Agentes de IA (ERC-8004)

**El Concepto:** Solo la élite pura (los que han forjado la Runestone) tiene el derecho de vincular un NFT de Inteligencia Artificial a su perfil de Signal.

### ¿Cómo funciona detrás de escena?

* **En el Frontend (Next.js):** La UI verifica en tiempo real `hasRunestone()`. Si es falso, oculta o bloquea el botón de vincular agente con un mensaje: "Requiere Runestone activa".
* **En la Blockchain (Smart Contract):** Cuando el usuario llama a `attachAgent()`, el contrato inteligente de Signal hace una llamada externa al contrato maestro de identidades (`IdentityRegistry`) de Arc Testnet. Le pregunta: "Oye, ¿esta wallet realmente es dueña de este NFT?". Si el registro dice que sí, el contrato guarda el ID del agente en tu perfil.

---

## 6. Radar de Infraestructura: Análisis de Red

**El Concepto:** La aplicación muestra en tiempo real cómo está la salud de Arc Testnet (Transacciones por segundo, costos promedio de red, historial de bloques).

### ¿Cómo funciona detrás de escena?

* **Fuera de la Blockchain (Off-chain / Frontend):** Esto no toca nuestro Smart Contract para nada. Nuestro Next.js se conecta directamente al "corazón" de la blockchain (el nodo proveedor o RPC). Cada ciertos segundos le pregunta: "¿Cuál fue el último bloque? ¿Cuánto gas cobró?", hace cálculos matemáticos locales y renderiza un panel de control estilo terminal para que la comunidad vea qué tan rápida y estable está Arc Testnet hoy