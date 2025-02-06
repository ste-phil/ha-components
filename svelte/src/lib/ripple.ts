// ripple.ts
export function ripple(node: HTMLElement, options: { color?: string; duration?: number } = {}) {
  const { color = 'rgba(0, 0, 0, 0.3)', duration = 600 } = options;

  function createRipple(event: MouseEvent) {
    const rect = node.getBoundingClientRect();

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.transform = 'scale(0)';
    ripple.style.opacity = '0.5';
    ripple.style.backgroundColor = color;
    ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height) * 2}px`;
    ripple.style.left = `${event.clientX - rect.left - rect.width}px`;
    ripple.style.top = `${event.clientY - rect.top - rect.width}px`;
    ripple.style.pointerEvents = 'none';
    ripple.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;

    node.appendChild(ripple);

    // Trigger animation
    requestAnimationFrame(() => {
      ripple.style.transform = 'scale(1)';
      ripple.style.opacity = '0';
    });

    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, duration);
  }

  node.addEventListener('click', createRipple);

  return {
    destroy() {
      node.removeEventListener('click', createRipple);
    }
  };
}
