import { createAction } from '@reduxjs/toolkit';

/**
 * Global "kill switch" action.
 * Dispatched on logout or when switching tenant. The root reducer listens for
 * it and resets EVERY slice back to its initial state, guaranteeing no data
 * from the previous tenant lingers in memory (anti data-bleeding).
 */
export const resetStore = createAction('app/reset');
