<RULE[project_guidelines]>
## Estándares de Desarrollo, Arquitectura y Seguridad para Agentes

Todos los agentes y subagentes que interactúen con el código de este proyecto (**Signal 0xL**) DEBEN apegarse a los siguientes principios de ingeniería. El objetivo principal es mantener un estándar alto de calidad y seguridad, **sin que esto limite el crecimiento, la funcionalidad o la escalabilidad de la aplicación**.

### 1. Calidad del Código (Cero Deuda Técnica)
* **Cero Parches Rápidos:** No implementes soluciones temporales o "hacks" para salir del paso. Si un error revela una falla estructural, refactoriza de forma inteligente.
* **Código Limpio y Modular:** Escribe funciones con una única responsabilidad. Evita el código espagueti y mantén la legibilidad (nombres descriptivos, comentarios centrados en el "por qué").

### 2. Arquitectura de Software y RPCs
* **Eficiencia vs Crecimiento:** La prioridad es ser eficientes con recursos gratuitos, pero **esta eficiencia nunca debe estancar el crecimiento del proyecto ni paralizar la adopción de nuevas tecnologías**.
* **Adopción de Infraestructura:** No reinventes la rueda. Cuando el proyecto lo demande, es obligatorio migrar a infraestructuras estándar (Bundlers como Vite, SDKs oficiales como Circle App Kit, librerías robustas) en lugar de mantener Vanilla JS rígido.
* **Separación de Responsabilidades:** Mantén una arquitectura desacoplada. La lógica de estado, la interacción Web3 y la renderización de la UI deben estar en capas separadas.

### 3. Seguridad Front-to-Blockchain (Auditoría Continua)
* **Prevenir Manipulación del Frontend:** Asume siempre que un desarrollador malicioso o un atacante oportunista puede alterar el frontend (modificar variables en el navegador, alterar payloads, saltarse validaciones visuales).
* **Validación de Integridad:** Audita cualquier implementación que conecte el frontend con la blockchain. Asegúrate de que los datos enviados a los Smart Contracts (parámetros, valores de transacciones) no puedan ser manipulados desde el cliente para obtener ventajas injustas. 
* **Desconfianza por Defecto:** Nunca confíes ciegamente en los datos que provienen del lado del cliente. La interfaz es solo visual; la seguridad real debe estar respaldada por validaciones robustas y la lógica del contrato.

### 4. Regla de Oro del Flujo de Trabajo
* **Piensa Antes de Codificar:** Analiza cómo tus cambios afectarán la seguridad y la arquitectura global.
* **Regla del Boy Scout:** Deja el código siempre mejor y más limpio de lo que lo encontraste, garantizando que tus mejoras no rompan la flexibilidad del sistema.
</RULE[project_guidelines]>
