import { useEffect, useRef } from 'react';

const MAX_INTERVAL_MS = 50;
const MIN_BARCODE_LENGTH = 4;

/**
 * Captures input from a USB/Bluetooth HID barcode scanner acting as a
 * keyboard wedge. Scanners fire keystrokes far faster than a human can
 * type, so a burst of digits arriving within MAX_INTERVAL_MS of each
 * other, terminated by Enter, is treated as a scan. Normal typing (larger
 * gaps) resets the buffer and is left untouched.
 */
export function useBarcodeScanner(onScan, { enabled = true } = {}) {
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e) {
      const now = Date.now();
      const elapsed = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (elapsed > MAX_INTERVAL_MS) {
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        const code = bufferRef.current;
        bufferRef.current = '';
        if (code.length >= MIN_BARCODE_LENGTH && /^\d+$/.test(code)) {
          onScan(code);
          e.preventDefault();
        }
        return;
      }

      if (/^\d$/.test(e.key)) {
        bufferRef.current += e.key;
      } else if (e.key.length === 1) {
        bufferRef.current = '';
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [onScan, enabled]);
}
