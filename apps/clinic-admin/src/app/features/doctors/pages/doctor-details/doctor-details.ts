import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DoctorService } from '../../services/doctor.service';
import { DoctorCard } from '../../components/doctor-card/doctor-card';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

@Component({
  selector: 'app-doctor-details',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule, DoctorCard],
  templateUrl: './doctor-details.html',
  styleUrl: './doctor-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorDetails {
  private readonly doctorService = inject(DoctorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly doctorId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly doctor = toSignal(this.doctorService.getDoctor(this.doctorId), {
    initialValue: undefined,
  });
  readonly doctorsPath = ROUTE_PATHS.DOCTORS;

  editDoctor(): void {
    this.router.navigate([this.doctorsPath, this.doctorId, 'edit']);
  }
}
