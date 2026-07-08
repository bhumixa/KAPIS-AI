import { ActivatedRouteSnapshot } from '@angular/router';
import { Breadcrumb } from '../models/breadcrumb.model';

/**
 * Walks the activated route tree collecting `data.breadcrumb` from every
 * segment that contributes a URL path, so nested feature routes (added in
 * later sprints) get breadcrumbs for free just by setting route `data`.
 */
export function buildBreadcrumbs(
  route: ActivatedRouteSnapshot | null,
  parentUrl = '',
  breadcrumbs: Breadcrumb[] = [],
): Breadcrumb[] {
  if (!route) {
    return breadcrumbs;
  }

  const segment = route.url.map((segment) => segment.path).join('/');
  const url = segment ? `${parentUrl}/${segment}` : parentUrl;
  const label = route.data['breadcrumb'] as string | undefined;

  if (label) {
    breadcrumbs.push({ label, url });
  }

  return buildBreadcrumbs(route.firstChild, url, breadcrumbs);
}
