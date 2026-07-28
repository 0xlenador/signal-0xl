<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Todo parte desde contracts\Signal0xL.sol

El smart contract Signal0xL.sol es el que esta desplegado, nunca dudar de él, cuando algo falle en la aplicacion, analiza el smart contract, pero es de solo lectura, nunca modificar, usamos otros entornos para segurarnos de que funcione correcto, asi que tu solo lo estudiaras cuando necesites implementar, auditar, comprender, modificar y/o proponer nuevas funciones.

# pnpm

Aca usamos pnpm en vez de npm

# Fundamentos y mis notas

El archivo Docs\my_thoughts.md es como se ideo el plan para desplegar el contrato inteligente Signal0xL.sol, luego se desplego el contrato inteligente y de alli obtenemos los fundamentos aqui: Docs\fundamentals.md. el contrato ya esta desplegado y funcionando asi que es el centro y motor de nuestra dapp.

# Ingenieria de software de primer nivel

Nada de deuda tecnica, parches, espaguetti code. Todo desde la maestria de un ingeniero de softawre que siempre utilizara las mejores practicas de desarrollo.

# Web3

Implementar funciones en web3 suele crear bugs para el usuario, ejemplo: si conecta una wallet y luego cambia a otra wallet suele romper algo, asi que cada funcion implementada en la UI debe ser pensada para que todo quede perfecto, no solo solucionar una accion o funcion, si no que no altere nada mas en la dapp, lo que dije es solo un ejemplo de muchos, ya que normalmente si un dato debe mostrase, otro dato dejara de mostrarse, bien sea por temas de Apis, RCPs, etc que dejan de funcionar por saturacion de peticiones, a ver tomate estos ejemplos como solo ejemplos de miles, lo que trato de decir es que siempre piensa como ingeniero de software e implementando todo un sistema sin fallos en web3, ya que normalmente los agentes suelen arreglar algo a la ligera pero rompen otra cosa, asi lo tengamos establecido en las reglas.

# Idioma en UI

A pesar de que el código, textos de la interfaz (UI) y documentación del proyecto deben ser escritos SIEMPRE en inglés nativo, TUS RESPUESTAS EN EL CHAT Y TUS PENSAMIENTOS DEBEN SER 100% EN ESPAÑOL. NUNCA me hables ni me respondas en inglés. No introduzcas texto en español en la base de código.

# Accesibilidad y Diseño UI

Prioriza siempre la legibilidad y usabilidad sobre la estética vacía:
* **Contraste:** Mantén siempre un contraste WCAG AA o superior en toda la interfaz.
* **Jerarquía Visual:** Los textos principales deben ser casi negros (o blancos puros en modo oscuro). Los textos secundarios deben ser un gris oscuro legible. SÓLO los elementos deshabilitados pueden usar gris claro.
* **Información Clave:** Nunca uses texto o iconos gris claro sobre fondo blanco (o gris oscuro sobre fondo negro) si contienen información importante.
* **Enfoque Práctico:** Diseña pensando en un dashboard profesional que será operado durante horas continuas (esfuerzo visual mínimo), NO en una captura de pantalla puramente estética para Dribbble o redes sociales.

# Estándares de UI (Tailwind & Shadcn)

Para mantener la base de código libre de CSS espagueti y deuda técnica:
* **No CSS Custom:** Queda estrictamente prohibido añadir nuevas clases personalizadas en `globals.css` (ej. `.btn-custom`, `.glass-panel`). TODO el estilo debe resolverse mediante utilidades de Tailwind en línea.
* **Uso exclusivo de Shadcn:** Para cualquier elemento de interfaz (botones, tarjetas, modales, tablas), utiliza siempre los componentes de Shadcn UI (`pnpm dlx shadcn@latest add <component>`). No reinventes la rueda construyendo componentes desde cero con `divs` básicos a menos que sea estrictamente necesario por una personalización extrema.
* **Paleta de colores del sistema:** Usa las variables del sistema (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`) en lugar de colores quemados (`bg-white`, `text-black`, `bg-slate-900`) para garantizar que la interfaz responda perfectamente a los temas neutros e iteraciones futuras.