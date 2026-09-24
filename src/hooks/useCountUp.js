import { useEffect, useRef, useState } from 'react';

const DURATION_MS = 700;

/**
 * Animates a displayed number from its previous value to `target` whenever
 * `target` changes. Returns a float — round it at render time.
 */
export function useCountUp(target) {
  const [value, setValue] = useState(target ?? 0);
  const fromRef = useRef(target ?? 0);

  useEffect(() => {
    if (typeof target !== 'number' || Number.isNaN(target)) return;
    const from = fromRef.current;
    const start = performance.now();
    let frame;

    function tick(now) {
      const t = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - (1 - t) ** 3;
      setValue(from + (target - from) * eased);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
}
