import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { map } from 'rxjs';
import { Toolbar } from '../components/toolbar/toolbar';
import { Sidenav } from '../components/sidenav/sidenav';
import { Breadcrumb } from '../../shared/components/breadcrumb/breadcrumb';
import { Loading } from '../../shared/components/loading/loading';

/**
 * Shell for every authenticated route: fixed toolbar, collapsible sidenav,
 * and a content area with a breadcrumb trail + router outlet. The sidenav
 * mode flips between "side" (desktop, always open) and "over" (mobile,
 * overlay) based on viewport width.
 */
@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, MatSidenavModule, Toolbar, Sidenav, Breadcrumb, Loading],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardLayout {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly sidenav = viewChild.required(MatSidenav);

  readonly isHandset = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  toggleSidenav(): void {
    this.sidenav().toggle();
  }
}
