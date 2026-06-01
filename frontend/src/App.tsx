import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLayout from './components/ProtectedLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

/**
 * Enrutamiento:
 *   /login                       -> login público
 *   /:tenantSlug/dashboard       -> protegido (Route Guard + tenant en la URL)
 *   *                            -> redirige a /login
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Todas las rutas acotadas al tenant pasan por el guard. */}
        <Route path="/:tenantSlug" element={<ProtectedLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
