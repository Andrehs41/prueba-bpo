import { useEffect, useState } from 'react';

/**
 * Devuelve una copia con debounce de `value` que solo se actualiza tras `delay`
 * ms sin cambios. Se usa para evitar re-filtrar la tabla de registros en cada
 * pulsación de tecla.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
