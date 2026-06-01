import { useEffect } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';

/**
 * Route Guard + Layout for tenant-scoped routes (/:tenantSlug/*).
 *
 * Protects the view when:
 *   - the user is not authenticated (no token), or
 *   - the :tenantSlug in the URL does not match the authenticated tenant.
 *
 * The second check stops a user from simply editing the URL to peek at another
 * tenant. (The backend is still the real authority - this is just UX defense.)
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
