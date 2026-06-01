import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { login, clearAuthError } from '../features/auth/authSlice';
import { resetStore } from '../app/resetAction';

/**
 * Login page (no tenant in the URL). The user picks the tenant here; on success
 * we redirect to /:tenantSlug/dashboard.
 */
export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error } = useAppSelector((s) => s.auth);

  const [tenantSlug, setTenantSlug] = useState('acme');
  const [email, setEmail] = useState('admin@acme.com');
  const [password, setPassword] = useState('admin123');

  // Landing on /login means "fresh session": wipe any residual tenant data.
  useEffect(() => {
    dispatch(resetStore());
  }, [dispatch]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(
      login({ tenantSlug: tenantSlug.trim(), email: email.trim(), password })
    );
    if (login.fulfilled.match(result)) {
      navigate(`/${result.payload.tenant.slug}/dashboard`);
    }
  }

  return (
    <div className="centered">
      <form className="card" onSubmit={handleSubmit}>
        <h1>Multi-Tenant Login</h1>

        <label>
          Tenant slug
          <input value={tenantSlug} onChange={(e) => setTenantSlug(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="hint">
          Seed: <code>acme</code> / admin@acme.com / admin123 (ADMIN) ·
          user@acme.com / user123 (USER) · <code>globex</code> / admin@globex.com / admin123
        </p>
      </form>
    </div>
  );
}
