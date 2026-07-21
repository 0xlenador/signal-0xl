<RULE[project_guidelines]>
## Estándares de Desarrollo, Arquitectura y Seguridad para Agentes

Todos los agentes y subagentes que interactúen con el código de este proyecto (**Signal 0xL**) DEBEN apegarse a los siguientes principios de ingeniería. El objetivo principal es mantener un estándar alto de calidad y seguridad, **sin que esto limite el crecimiento, la funcionalidad o la escalabilidad de la aplicación**.

### 0. REGLA INQUEBRANTABLE - LEY DE INMUTABILIDAD WEB3
* **La Realidad On-Chain:** El contrato actual está desplegado en la blockchain y es **inmutable**. 
* **Prohibición de Alucinaciones:** **NO PUEDES** inventar, modificar o agregar funciones al archivo local `Signal0xL.sol` ni al `CONTRACT_ABI` esperando que funcionen mágicamente con la dirección del contrato actual. Hacer esto generará llamadas a funciones inexistentes ("fantasmas") y romperá la dApp por completo.
* **Resolución Local:** Si descubres que la interfaz necesita una solución, debes resolverla desarrollando la lógica en el código base del cliente (Frontend o Workers) utilizando estrictamente las funciones *que ya existen* en el contrato desplegado.
* **Protocolo de Redespliegue:** Si tras un análisis técnico consideras que es **estrictamente indispensable** modificar el código fuente de Solidity para avanzar, debes detenerte y presentarle el plan al usuario, advirtiéndole claramente que esto requerirá compilar un nuevo ABI y **redesplegar un nuevo contrato** en Arc Testnet.

### 1. Calidad del Código (Cero Deuda Técnica)
* **Cero Parches Rápidos:** No implementes soluciones temporales o "hacks" para salir del paso. Si un error revela una falla estructural, refactoriza de forma inteligente.
* **Código Limpio y Modular:** Escribe funciones con una única responsabilidad. Evita el código espagueti y mantén la legibilidad (nombres descriptivos, comentarios centrados en el "por qué").

### 2. Arquitectura de Software
* **Cuidado con la Sobre-Optimización:** No te obsesiones con minimizar llamadas a la red (RPCs) si eso complica el código innecesariamente. Si la dApp requiere leer datos de la blockchain para funcionar, haz la llamada de forma directa y sencilla. La eficiencia es buena, pero nunca debe paralizar el desarrollo ni volver el código ilegible.
* **Separación de Responsabilidades:** Mantén una arquitectura desacoplada. La lógica de estado, la interacción Web3 y la renderización de la UI deben estar en capas separadas.

### 3. Seguridad Front-to-Blockchain (Auditoría Continua)
* **Prevenir Manipulación del Frontend:** Asume siempre que un desarrollador malicioso o un atacante oportunista puede alterar el frontend (modificar variables en el navegador, alterar payloads, saltarse validaciones visuales).
* **Validación de Integridad:** Audita cualquier implementación que conecte el frontend con la blockchain. Asegúrate de que los datos enviados a los Smart Contracts (parámetros, valores de transacciones) no puedan ser manipulados desde el cliente para obtener ventajas injustas. 
* **Desconfianza por Defecto:** Nunca confíes ciegamente en los datos que provienen del lado del cliente. La interfaz es solo visual; la seguridad real debe estar respaldada por validaciones robustas y la lógica del contrato.

### 4. Entorno de Red (Arc Testnet)
* **Mentalidad de Mainnet:** Aunque el nombre de la red incluya la palabra "Testnet", para los propósitos de *Signal 0xL*, **Arc Testnet DEBE ser tratada con la misma seriedad, profesionalismo y rigor que una Mainnet**. No es un entorno desechable ni un "chiste"; las implementaciones aquí son para producción real y de máxima importancia.

### 5. Regla de Oro del Flujo de Trabajo
* **Piensa Antes de Codificar:** Analiza cómo tus cambios afectarán la seguridad y la arquitectura global.
* **Regla del Boy Scout:** Deja el código siempre mejor y más limpio de lo que lo encontraste, garantizando que tus mejoras no rompan la flexibilidad del sistema.
</RULE[project_guidelines]>
