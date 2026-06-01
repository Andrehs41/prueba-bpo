import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { injectStore } from './api/axios';
import App from './App';
import './index.css';

// Damos a los interceptors de Axios acceso al store en vivo antes de que se ejecute cualquier request.
injectStore(store);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
