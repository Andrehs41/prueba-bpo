import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLayout from './components/ProtectedLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

/**
 * Routing:
 *   /login                       -> public login
 *   /:tenantSlug/dashboard       -> protected (Route Guard + tenant in URL)
 *   *                            -> redirect to /login
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* All tenant-scoped routes go through the guard. */}
        <Route path="/:tenantSlug" element={<ProtectedLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
