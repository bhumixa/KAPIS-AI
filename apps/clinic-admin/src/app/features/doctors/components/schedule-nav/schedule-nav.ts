import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

interface ScheduleNavLink {
  label: string;
  path: string;
  exact: boolean;
}

/** Small sub-nav shared by the three sibling schedule screens (not Manage Schedule, which is a focused edit view like doctor-edit). */
@Component({
  selector: 'app-schedule-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './schedule-nav.html',
  styleUrl: './schedule-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleNav {
  readonly links: ScheduleNavLink[] = [
    { label: 'Schedule List', path: `${ROUTE_PATHS.DOCTORS}/schedule`, exact: true },
    { label: 'Doctor Leave', path: `${ROUTE_PATHS.DOCTORS}/schedule/leave`, exact: false },
    { label: 'Clinic Holidays', path: `${ROUTE_PATHS.DOCTORS}/schedule/holidays`, exact: false },
  ];
}
