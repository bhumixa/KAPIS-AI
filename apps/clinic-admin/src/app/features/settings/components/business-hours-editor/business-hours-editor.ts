import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { DAYS_OF_WEEK, DayOfWeek } from '../../../doctors/models/doctor-schedule.model';
import {
  BusinessDayHours,
  BusinessHours,
  BusinessHoursInput,
} from '../../models/business-hours.model';

type DayFormGroup = FormGroup<{
  isOpen: FormControl<boolean>;
  openTime: FormControl<string>;
  closeTime: FormControl<string>;
  lunchBreakStart: FormControl<string>;
  lunchBreakEnd: FormControl<string>;
}>;

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

/**
 * Weekly grid editor for the clinic's own opening hours - structurally the
 * same "one `FormGroup` per day-of-week" shape as `WeeklyScheduleEditor`
 * (Sprint 3), but not the same component: the fields differ (a single
 * open/close window plus a lunch break, not two doctor-consultation
 * windows), so reusing `WeeklyScheduleEditor` itself would mean bending its
 * form shape to a different domain rather than genuinely sharing logic.
 */
@Component({
  selector: 'app-business-hours-editor',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './business-hours-editor.html',
  styleUrl: './business-hours-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessHoursEditor {
  private readonly formBuilder = inject(FormBuilder);

  readonly businessHours = input<BusinessHours | null>(null);
  readonly isSaving = input(false);

  readonly save = output<BusinessHoursInput>();

  readonly dayNames = DAYS_OF_WEEK;
  readonly dayLabels = DAY_LABELS;
  readonly openByDay = signal<boolean[]>(DAYS_OF_WEEK.map(() => true));

  readonly form = this.formBuilder.group({
    days: this.formBuilder.array(DAYS_OF_WEEK.map(() => this.buildDayGroup())),
  });

  get dayControls(): DayFormGroup[] {
    return this.form.controls.days.controls;
  }

  constructor() {
    effect(() => {
      const hours = this.businessHours();
      if (hours) {
        hours.days.forEach((day, index) => this.dayControls[index]?.patchValue(day));
        this.openByDay.set(hours.days.map((day) => day.isOpen));
      }
    });
  }

  onOpenToggle(index: number, event: MatSlideToggleChange): void {
    this.openByDay.update((states) =>
      states.map((state, i) => (i === index ? event.checked : state)),
    );
  }

  submit(): void {
    if (this.form.invalid || this.isSaving()) {
      return;
    }

    const days: BusinessDayHours[] = this.form
      .getRawValue()
      .days.map((day, index) => ({ day: DAYS_OF_WEEK[index], ...day }));

    this.save.emit({ days });
  }

  private buildDayGroup(): DayFormGroup {
    return this.formBuilder.nonNullable.group({
      isOpen: this.formBuilder.nonNullable.control<boolean>(true),
      openTime: ['09:00', Validators.required],
      closeTime: ['18:00', Validators.required],
      lunchBreakStart: ['13:00', Validators.required],
      lunchBreakEnd: ['14:00', Validators.required],
    });
  }
}
