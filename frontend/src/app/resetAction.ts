import { createAction } from '@reduxjs/toolkit';

/**
 * Acción global de "interruptor de apagado".
 * Se despacha al cerrar sesión o al cambiar de tenant. El root reducer la
 * escucha y restablece TODOS los slices a su estado inicial, garantizando que
 * ningún dato del tenant anterior quede en memoria (anti data-bleeding).
 */
export const resetStore = createAction('app/reset');
