// Floating Particles & Atmospheric Animation Engine

const PARTICLES_BY_EFFECT: Record<string, string[]> = {
  stars: ['⭐', '✨', '🌟', '💫'],
  hearts: ['❤️', '💖', '💕', '💓', '💗'],
  roses: ['🌹', '🌸', '💐', '🌺'],
  snow: ['❄️', '❅', '❆', '⛄'],
  fire: ['🔥', '⚡', '💥'],
  gold: ['💰', '👑', '🪙', '✨'],
  bubbles: ['🫧', '💧', '🫧'],
  confetti: ['🎉', '🎊', '🎈', '✨'],
};

export function setupChatEffects(containerId: string, effectName: string): () => void {
  const container = document.getElementById(containerId);
  if (!container) return () => {};

  // Clean old effects
  const oldEffectBox = container.querySelector('.chat-effects');
  if (oldEffectBox) {
    oldEffectBox.remove();
  }

  if (!effectName || effectName === 'none' || !PARTICLES_BY_EFFECT[effectName]) {
    return () => {};
  }

  const effectBox = document.createElement('div');
  effectBox.className = 'chat-effects active';
  container.prepend(effectBox);

  const icons = PARTICLES_BY_EFFECT[effectName];
  const maxParticles = 18;

  for (let i = 0; i < maxParticles; i++) {
    const p = document.createElement('div');
    const icon = icons[Math.floor(Math.random() * icons.length)];
    const animType = ['fall', 'sway', 'rise', 'pulse'][Math.floor(Math.random() * 4)];
    const duration = 4 + Math.random() * 6;
    const delay = Math.random() * 5;
    const leftPercent = Math.random() * 95;
    const size = 16 + Math.random() * 14;

    p.className = `particle ${animType}`;
    p.textContent = icon;
    p.style.left = `${leftPercent}%`;
    p.style.fontSize = `${size}px`;
    p.style.animationDuration = `${duration}s`;
    p.style.animationDelay = `${delay}s`;

    effectBox.appendChild(p);
  }

  return () => {
    effectBox.remove();
  };
}
