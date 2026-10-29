import { Navigate, useLocation, useParams } from 'react-router-dom';

/** تحويل رابط قديم مع الإبقاء على search وhash والمعاملات (مثل :semId). */
export function RedirectKeep({ to }: { to: string }) {
  const loc = useLocation();
  const params = useParams();
  const path = to.replace(/:([A-Za-z]+)/g, (_m, k: string) => encodeURIComponent(params[k] ?? ''));
  const [p, q = ''] = path.split('?');
  const search = new URLSearchParams(q);
  new URLSearchParams(loc.search).forEach((v, k) => search.set(k, v));
  const s = search.toString();
  return <Navigate to={`${p}${s ? `?${s}` : ''}${loc.hash}`} replace />;
}
