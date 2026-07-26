<div align="center">
  <h1><img src="public/icon.svg" width="36" height="36" alt="Signal 0xL Logo" /> Signal 0xL</h1>

  <p>
    <strong>Comprehensive platform for tracking and analyzing Web3 interactions</strong>
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
    <a href="https://signal-0xl.pages.dev/">View Live DApp</a>
    <span> · </span>
    <a href="https://testnet.arcscan.app/address/0x108E51F9af4aF2D8CAa1f41E81b91B84B1304d36?tab=contract">View Smart Contract</a>
  </h4>
</div>

<br/>

> **Signal 0xL** is a dApp deployed on **Arc Testnet**. Designed as a tool to visualize user and general network data, it uses a game-theory-based "daily GM" dynamic as a pretext to encourage constant interaction. 
> Its ecosystem is built upon 3 key pillars for the user: **Knowledge, Utility, and Entertainment**.
>
> 🚀 **Roadmap:** Currently operating in a testing phase (Testnet), with the infrastructure and contracts ready for official deployment on **Arc Mainnet** as soon as the network becomes available.

---

## 🏗️ Architecture and Tech Stack

The dApp is built under strict engineering standards, ensuring a robust Web3 integration that is free of technical debt and ready to scale.

| Layer | Key Technologies |
| :--- | :--- |
| **Frontend Core** | Next.js 16 (App Router), React 19, Tailwind CSS |
| **Web3 Engine** | Wagmi, Viem, RainbowKit |
| **Smart Contracts** | Solidity (Deployed on Arc Testnet, ready for Arc Mainnet) |

---

## ⚙️ System Prerequisites

Make sure you have the following tools before starting the local environment:

- **[Node.js](https://nodejs.org/)** (v18 or higher recommended)
- **[pnpm](https://pnpm.io/)** (Official package manager for this workspace)
- A **Web3 Wallet** (e.g., MetaMask or Rabby) configured to interact with the **Arc Testnet** network

---

## 🚀 Local Installation and Setup

Follow these strict steps to set up the DApp from scratch on any machine:

1. **Clone the repository:**
   ```bash
   git clone <REPOSITORY_URL>
   cd dapp
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up Environment Variables (CRITICAL):**
   Since `.env.local` is not uploaded to GitHub for security reasons, you must create it.
   ```bash
   cp .env.example .env.local
   ```
   *Note: Open `.env.local` and enter your private/public keys (e.g., WalletConnect Project ID). Without this, the application will not be able to connect wallets.*

4. **Start the development environment:**
   ```bash
   pnpm dev
   ```
   The application will be available at `http://localhost:3000`.

---

## 📁 Project Structure

The repository is organized under a strictly modular approach, separating on-chain logic from the graphical interface and documentation:

- 📂 **`contracts/`** — Contains the ABIs and references (read-only) for the `Signal0xL` Smart Contract. *Everything starts here.*
- 📂 **`Docs/`** — The brain of the project. This is where the economic fundamentals, game theory, and architectural rules reside.
- 📂 **`src/`** — The DApp's Frontend (Next.js App Router, React UI Components, Wagmi Hooks).
- 📂 **`scripts/`** — Utilities and automation scripts for the environment.
- 📂 **`worker/`** — Background processing logic.

---

## ⚙️ The Engine: Smart Contract ([`Signal0xL`](https://testnet.arcscan.app/address/0x108E51F9af4aF2D8CAa1f41E81b91B84B1304d36?tab=contract))

The smart contract is the logical and economic core of the protocol, deployed on the Arc network. 

### Contract Mechanics
The contract implements strict time-based (UTC) game theory:
- **Registration and Progress:** Handles the "Daily Signal", calculating consecutive streaks and awarding points.
- **Penalties:** If a user skips days, the contract calculates the inactivity and applies mathematical penalties by increasing their "fork level" (which makes interaction more expensive).
- **Loyalty Mechanics:** Manages the activation of 3 "Satellite Nodes" which, when turned on, form the Runestone, granting Super GM status (double rewards).
- **AI Agents (ERC-8004):** Communicates natively with the Arc `IdentityRegistry` to validate NFT ownership and allow elite users to bind AI Agents to their profiles.

### Platform Integration
Our DApp acts as the viewer and interaction interface for this contract:
- **On-chain Reading and Writing:** We use **Wagmi** and **Viem** to connect to the Arc network. The frontend reads the real-time state (points, streaks, current GM cost) to render the dashboard.
- **Centralized ABIs:** All contract function definitions live in the `contracts/` folder, serving as a typed bridge between Next.js and the blockchain.
- **Transactions:** Actions like `resetToVIP()` or activating nodes trigger transactions directly from the connected wallet, ensuring that the final and secure validation always occurs at the contract level.

*For a mathematical breakdown of the fees and economic rules that govern this contract, see `Docs/fundamentals.md`.*
