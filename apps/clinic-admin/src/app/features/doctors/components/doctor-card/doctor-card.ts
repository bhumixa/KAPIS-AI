import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Doctor } from '../../models/doctor.model';

@Component({
  selector: 'app-doctor-card',
  imports: [MatCardModule, MatIconModule, MatChipsModule, MatDividerModule, CurrencyPipe, TitleCasePipe],
  templateUrl: './doctor-card.html',
  styleUrl: './doctor-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorCard {
  readonly doctor = input.required<Doctor>();
}
