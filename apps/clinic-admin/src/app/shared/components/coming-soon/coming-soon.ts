import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { map } from 'rxjs';

/**
 * Placeholder screen for nav items whose feature isn't built yet
 * (Doctors, Patients, Appointments, Settings). The title comes from the
 * route's `data.title` so this one component covers every "Coming Soon" page.
 */
@Component({
  selector: 'app-coming-soon',
  imports: [MatIconModule],
  templateUrl: './coming-soon.html',
  styleUrl: './coming-soon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComingSoon {
  private readonly route = inject(ActivatedRoute);

  readonly title = toSignal(
    this.route.data.pipe(map((data) => (data['title'] as string) ?? 'This feature')),
    { initialValue: 'This feature' },
  );
}
