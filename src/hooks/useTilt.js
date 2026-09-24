import { useRef } from 'react';

const MAX_TILT_DEG = 8;

/**
 * Mouse-tracked 3D tilt. Spread the returned props onto an element that
 * also has the `.tilt-card` class (theme.css) — this hook only sets the
 * --tilt-x/--tilt-y custom properties that class reads.
 */
export function useTilt() {
  const ref = useRef(null);

  function handleMouseMove(e) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty('--tilt-x', `${(-py * MAX_TILT_DEG * 2).toFixed(2)}deg`);
    el.style.setProperty('--tilt-y', `${(px * MAX_TILT_DEG * 2).toFixed(2)}deg`);
  }

  function handleMouseLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
  }

  return { ref, onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave };
}
