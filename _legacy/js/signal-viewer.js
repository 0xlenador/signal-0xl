/**
 * signal-viewer.js
 * Genera "logs" ficticios pero verosímiles en el visor de señales (Live Signal Viewer).
 * Simula actividad constante de la red Arc Testnet para una estética matrix/cyberpunk.
 */

class LiveSignalViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.maxLines = 10; // Máximo número de líneas visibles al mismo tiempo para encajar en altura fija
    this.events = [
      () => `> [NETWORK] Syncing block: 52788${Math.floor(Math.random() * 900 + 100)}... OK`,
      () => `> [GAS] Network average adjusted: ${ (24 + Math.random() * 2).toFixed(2) } Gwei`,
      () => `> [SIGNAL] Anonymous user sent GM {+${Math.floor(Math.random() * 5 + 1)} pts}`,
      () => `> [NODES] Conviction tier activity detected (+${(Math.random() * 0.5).toFixed(2)}%)`,
      () => `> [SYSTEM] IdentityRegistry query successful`,
      () => `> [LEADERBOARD] New wallet 0x${Math.random().toString(16).substring(2, 6)}... joined Top 20`,
      () => `> [RUNESTONE] Resonance field stabilized`,
      () => `> [AGENT] ERC-8004 AI ping received`
    ];

    // Iniciar loop si el contenedor existe
    if (this.container) {
      this.startLoop();
    }
  }

  startLoop() {
    // Generar la primera señal rápido
    setTimeout(() => this.addSignal(), 500);

    // Loop aleatorio entre 1 y 3 segundos
    const loop = () => {
      const nextDelay = Math.random() * 2000 + 1000;
      setTimeout(() => {
        this.addSignal();
        loop();
      }, nextDelay);
    };
    loop();
  }

  addSignal() {
    if (!this.container) return;

    // Escoger evento aleatorio
    const eventText = this.events[Math.floor(Math.random() * this.events.length)]();
    
    // Crear elemento
    const line = document.createElement('div');
    line.className = 'signal-line flex items-center gap-1.5 whitespace-nowrap text-accent-primary';
    
    // Alternar colores a veces para destacar (ej. warning, success)
    if (eventText.includes('NETWORK') || eventText.includes('SYSTEM')) {
      line.classList.replace('text-accent-primary', 'text-text-muted');
    } else if (eventText.includes('GM') || eventText.includes('joined')) {
      line.classList.replace('text-accent-primary', 'text-accent-success');
    } else if (eventText.includes('GAS')) {
      line.classList.replace('text-accent-primary', 'text-accent-warning');
    }

    line.textContent = eventText;

    // Añadir al contenedor
    this.container.appendChild(line);

    // Mantener límite de líneas eliminando la más vieja 
    const currentLines = this.container.querySelectorAll('.signal-line');
    if (currentLines.length > this.maxLines) {
      this.container.removeChild(currentLines[0]);
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new LiveSignalViewer('signal-viewer-content');
});
