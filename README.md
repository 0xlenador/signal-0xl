<div align="center">
  <h1><img src="public/icon.svg" width="36" height="36" alt="Signal 0xL Logo" /> Signal 0xL</h1>

  <p>
    <strong>Plataforma integral de análisis y seguimiento de interacciones Web3</strong>
  </p>

  <!-- Badges -->
  <p>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16.2-black?logo=next.js" alt="Next.js" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://wagmi.sh/"><img src="https://img.shields.io/badge/Wagmi-2.19-blue" alt="Wagmi" /></a>
    <a href="https://viem.sh/"><img src="https://img.shields.io/badge/Viem-2.55-1e1e1e" alt="Viem" /></a>
    <a href="https://testnet.arcscan.app/address/0x108E51F9af4aF2D8CAa1f41E81b91B84B1304d36"><img src="https://img.shields.io/badge/Smart%20Contract-Solidity-363636?logo=solidity" alt="Smart Contract" /></a>
  </p>

  <h4>
    <a href="https://signal-0xl.pages.dev/">Ver DApp en Vivo</a>
    <span> · </span>
    <a href="https://testnet.arcscan.app/address/0x108E51F9af4aF2D8CAa1f41E81b91B84B1304d36?tab=contract">Ver Contrato Inteligente</a>
  </h4>
</div>

<br/>

> **Signal 0xL** es una dApp desplegada en **Arc Testnet**. Diseñada como una herramienta para visualizar datos del usuario y de la red general, utiliza una dinámica de "GM diario" basado en teoría de juegos como pretexto para fomentar la interacción constante. 
> Su ecosistema se fundamenta en 3 pilares clave para el usuario: **Conocimiento, Utilidad y Entretenimiento**.
>
> 🚀 **Roadmap:** Actualmente operando en fase de pruebas (Testnet), con la infraestructura y contratos listos para el despliegue oficial en **Arc Mainnet** en cuanto la red esté disponible.

---

## 🏗️ Arquitectura y Stack Tecnológico

La dApp está construida bajo estándares estrictos de ingeniería, garantizando una integración Web3 robusta, libre de deuda técnica y preparada para escalar.

| Capa | Tecnologías Clave |
| :--- | :--- |
| **Frontend Core** | Next.js 16 (App Router), React 19, Tailwind CSS |
| **Web3 Motor** | Wagmi, Viem, RainbowKit |
| **Smart Contracts** | Solidity (Desplegados en Arc Testnet, listos para Arc Mainnet) |

---

## ⚙️ Prerrequisitos del Sistema

Asegúrate de contar con las siguientes herramientas antes de iniciar el entorno local:

- **[Node.js](https://nodejs.org/)** (v18 o superior recomendado)
- **[pnpm](https://pnpm.io/)** (Gestor de paquetes oficial de este workspace)
- Una **Wallet Web3** (ej. MetaMask o Rabby) configurada para interactuar con la red **Arc Testnet**

---

## 🚀 Instalación y Configuración Local

Sigue estos pasos rigurosos para levantar la DApp desde cero en cualquier máquina:

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd dapp
   ```

2. **Instalar dependencias:**
   ```bash
   pnpm install
   ```

3. **Configurar Variables de Entorno (CRÍTICO):**
   Dado que `.env.local` no se sube a GitHub por seguridad, debes crearlo.
   ```bash
   cp .env.example .env.local
   ```
   *Nota: Abre `.env.local` e introduce tus llaves privadas/públicas (ej. Project ID de WalletConnect). Sin esto, la aplicación no podrá conectar wallets.*

4. **Levantar el entorno de desarrollo:**
   ```bash
   pnpm dev
   ```
   La aplicación estará disponible en `http://localhost:3000`.

---

## 📁 Estructura del Proyecto

El repositorio está organizado bajo un enfoque estrictamente modular, separando la lógica on-chain de la interfaz gráfica y la documentación:

- 📂 **`contracts/`** — Contiene los ABIs y referencias (solo lectura) del Smart Contract `Signal0xL`. *Todo parte de aquí.*
- 📂 **`Docs/`** — Cerebro del proyecto. Aquí residen los fundamentos económicos, teoría de juegos y reglas arquitectónicas.
- 📂 **`src/`** — Frontend de la dApp (Next.js App Router, Componentes React UI, Hooks de Wagmi).
- 📂 **`scripts/`** — Utilidades y scripts de automatización para el entorno.
- 📂 **`worker/`** — Lógica de procesamiento en segundo plano.

---

## ⚙️ El Motor: Smart Contract ([`Signal0xL`](https://testnet.arcscan.app/address/0x108E51F9af4aF2D8CAa1f41E81b91B84B1304d36?tab=contract))

El contrato inteligente es el núcleo lógico y económico del protocolo, desplegado en la red Arc. 

### Funcionamiento del Contrato
El contrato implementa una teoría de juegos estricta basada en el tiempo (UTC):
- **Registro y Progreso:** Maneja el "Daily Signal", calculando rachas consecutivas y otorgando puntos.
- **Penalizaciones:** Si un usuario omite días, el contrato calcula la inactividad y aplica penalizaciones matemáticas incrementando su "bifurcación" (lo que encarece la interacción).
- **Mecánicas de Lealtad:** Gestiona la activación de 3 "Nodos Satélite" que, al encenderse, forman la Runestone, otorgando el estatus de Super GM (recompensas dobles).
- **Agentes IA (ERC-8004):** Se comunica nativamente con el `IdentityRegistry` de Arc para validar la propiedad de NFTs y permitir a los usuarios de élite vincular Agentes IA a sus perfiles.

### Integración en la Plataforma
Nuestra DApp actúa como el visor e interfaz de interacción de este contrato:
- **Lectura y Escritura On-chain:** Utilizamos **Wagmi** y **Viem** para conectarnos a la red Arc. El frontend lee el estado en tiempo real (puntos, rachas, costo actual del GM) para renderizar el panel de control.
- **ABIs Centralizados:** Toda la definición de funciones del contrato vive en la carpeta `contracts/`, sirviendo como puente tipado entre Next.js y la blockchain.
- **Transacciones:** Acciones como `resetToVIP()` o activar nodos disparan transacciones directamente desde la wallet conectada, dejando que la validación final y segura siempre ocurra a nivel de contrato.

*Para un desglose matemático de las tarifas y reglas económicas que gobiernan este contrato, consulta `Docs/fundamentals.md`.*
