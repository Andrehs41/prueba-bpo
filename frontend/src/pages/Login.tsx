import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { login, clearAuthError } from '../features/auth/authSlice';
import { resetStore } from '../app/resetAction';
import { api } from '../api/axios';

interface TenantOption {
  id: number;
  slug: string;
  name: string;
}

/**
 * Página de login (sin tenant en la URL). La empresa se elige desde un selector
 * que se llena con GET /tenants. Al autenticar se navega a /:slug/dashboard.
 */
export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error } = useAppSelector((s) => s.auth);

  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);

  // Campos vacíos: nunca se prellenan credenciales.
  const [tenantSlug, setTenantSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Entrar a /login = sesión nueva: se limpia cualquier dato residual del tenant.
  useEffect(() => {
    dispatch(resetStore());
  }, [dispatch]);

  // Cargar la lista de empresas disponibles para el selector.
  useEffect(() => {
    let active = true;
    api
      .get<TenantOption[]>('/tenants')
      .then(({ data }) => {
        if (active) setTenants(data);
      })
      .catch(() => {
        /* el error se refleja al deshabilitar el selector */
      })
      .finally(() => {
        if (active) setLoadingTenants(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(
      login({ tenantSlug, email: email.trim(), password })
    );
    if (login.fulfilled.match(result)) {
      navigate(`/${result.payload.tenant.slug}/dashboard`);
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="brand">
          <span className="brand-dot" />
          <h1>Plataforma Multi-Tenant</h1>
          <p className="subtitle">Inicia sesión en tu empresa</p>
        </div>

        <label>
          Empresa
          <select
            value={tenantSlug}
            onChange={(e) => setTenantSlug(e.target.value)}
            disabled={loadingTenants}
            required
          >
            <option value="" disabled>
              {loadingTenants ? 'Cargando empresas…' : 'Selecciona una empresa'}
            </option>
            {tenants.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@empresa.com"
            autoComplete="off"
            required
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="off"
            required
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={status === 'loading' || !tenantSlug}>
          {status === 'loading' ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
