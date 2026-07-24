# Fundamentos y Arquitectura del Protocolo: Signal 0xL

Signal 0xL es una dApp en Arc Testnet basada en teoría de juegos (Game Theory). Su economía está diseñada para premiar la constancia diaria y penalizar el abandono, utilizando una moneda estable (USDC) con un Costo Base de 0.01 USDC.

---

## 1. La Ley del GM (The Daily Signal)

* **Ventana Estricta UTC:** El día en el contrato se reinicia exactamente a las 00:00 UTC. Solo se puede realizar un GM por día oficial.
* **Registro Invisible:** No existe el botón de "Registrarse". El primer GM que realiza un usuario inicializa su cuenta, le otorga el estatus de élite VIP (Bifurcación 1), establece su racha en 1 y le da +1 punto.
* **Puntuación Sagrada:** Cada GM otorga +1 punto (o +2 puntos si se tiene la Runestone). Los puntos y el historial total de GMs jamás se pierden, sin importar cuántas veces el usuario pierda su racha o sea penalizado.

---

## 2. El Látigo: Pérdida de Racha, Deuda y Bifurcaciones

El contrato no perdona la inactividad. Si un usuario deja pasar más de un día UTC sin hacer GM, su cuenta sufre tres consecuencias inmediatas la próxima vez que intente hacer GM:

* **Reseteo de Racha y Nodos:** Su racha de días consecutivos cae a 0 y todos sus nodos satélite activos se apagan instantáneamente.
* **Aumento de Bifurcación (`forkLevel`):** La cuenta cae un nivel (de B1 pasa a B2, si vuelve a fallar a B3, luego B4, etc.). Cada nivel que cae hace que el costo del GM diario sea más caro, sumando un 50% del costo base por cada escalón:
> **VIP (B1) = 0.01 USDC | B2 = 0.015 USDC | B3 = 0.02 USDC | B4 = 0.025 USDC...**


* **La Deuda Retroactiva:** El usuario debe pagar por los días intermedios que no entró a la aplicación. El contrato calcula exactamente cuántos días faltó y se los cobra todos juntos al costo base de 0.01 USDC por día, sumados al costo del GM de hoy.

---

## 3. La Redención: resetToVIP() (El Botón de Rescate)

Si un usuario cae a una bifurcación muy alta (por ejemplo, B10) donde hacer el GM diario ya es demasiado costoso, el contrato le ofrece un botón de reinicio para salvar su cuenta: Reset a VIP.

* **Qué hace:** Por el simple costo de gas de la red ($0 USDC para el contrato), el usuario regresa su cuenta inmediatamente a Bifurcación 1 (VIP).
* **El Precio a Pagar:** Para volver a ser VIP, el usuario acepta que su racha caiga a 0 y que sus nodos satélite se apaguen.
* **El Efecto Real en el Próximo GM:** El reinicio no borra el tiempo que el usuario estuvo inactivo. Si un usuario inactivo usa `resetToVIP()`, baja a B1. Al hacer su GM ese mismo día, como el contrato detecta que venía de una inactividad, lo subirá de B1 a B2 y le cobrará los días pendientes a la tarifa plana de 0.01 USDC. El valor del reset es evitar que el sistema te suba a B11 y te cobre un GM carísimo, permitiéndote volver a empezar tu camino desde abajo (en B2).

---

## 4. Nodos Satélite y La Piedra Rúnica (Runestone)

El objetivo final del juego es encender los 3 Nodos Satélite (Compromiso, Convicción y Legado) para ensamblar la "Runestone". Tener la Runestone activa convierte al usuario en un Super GM, duplicando sus recompensas a +2 puntos diarios.

Existen dos caminos para activarlos:

* **La Vía del Esfuerzo (`activateNodeByStreak`):** Al alcanzar rachas consecutivas de 3, 12 y 25 días, activar cada nodo solo cuesta el costo base plana de 0.01 USDC.
* **La Vía Instantánea / Ballenas (`activateNodeInstant`):** Permite encender los nodos sin esperar los días de racha, pero el precio depende del estado del usuario:
* **Si eres VIP (B1):** Pagas un precio premium muy alto por la impaciencia: Nodo 1 = 0.51 USDC, Nodo 2 = 1.26 USDC, Nodo 3 = 5.01 USDC.
* **Si caíste en Bifurcación (B2 o superior):** Como beneficio de consuelo por haber perdido el estatus VIP, el contrato te permite activar cualquier nodo al instante pagando solo 0.01 USDC, sin pagar precios de ballena.



---

## 5. La Economía de Agentes (ERC-8004)

Es el campo más exclusivo del contrato: la capacidad de vincular un Agente de Inteligencia Artificial al perfil de usuario mediante un NFT.

* **El Requisito de Élite:** La función `attachAgent()` fallará si el usuario no tiene la Runestone activa (los 3 nodos encendidos al mismo tiempo).
* **Validación en la Red:** El contrato se comunica en tiempo real con el registro `IdentityRegistry` de Arc Testnet para asegurarse de que la wallet del usuario sea la dueña legítima de ese NFT de agente antes de permitir la vinculación.