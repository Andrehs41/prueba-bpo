import { useEffect } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';

/**
 * Route Guard + Layout para las rutas acotadas al tenant (/:tenantSlug/*).
 *
 * Protege la vista cuando:
 *   - el usuario no está autenticado (sin token), o
 *   - el :tenantSlug de la URL no coincide con el tenant autenticado.
 *
 * La segunda comprobación impide que un usuario simplemente edite la URL para
 * espiar otro tenant. (El backend sigue siendo la autoridad real; esto es solo
 * una defensa a nivel de UX.)
 */
export default function ProtectedLayout() {
  const { tenantSlug } = useParams();
  const token = useAppSelector((s) => s.auth.token);
  const tenant = useAppSelector((s) => s.tenant.current);

  const isAuthenticated = Boolean(token);
  const slugMatches = tenant?.slug === tenantSlug;

  useEffect(() => {
    document.title = tenant ? `${tenant.name} · Dashboard` : 'BPO Multi-Tenant';
  }, [tenant]);

  if (!isAuthenticated || !tenantSlug || !slugMatches) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
