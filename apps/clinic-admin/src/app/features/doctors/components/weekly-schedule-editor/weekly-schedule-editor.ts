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
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  DAYS_OF_WEEK,
  DaySchedule,
  DayOfWeek,
  DoctorSchedule,
  DoctorScheduleInput,
} from '../../models/doctor-schedule.model';

type DayFormGroup = FormGroup<{
  isWorking: FormControl<boolean>;
  morningStart: FormControl<string>;
  morningEnd: FormControl<string>;
  afternoonStart: FormControl<string>;
  afternoonEnd: FormControl<string>;
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
 * Reusable weekly editor: `manage-schedule` uses it read/write, `doctor-details`'
 * Schedule tab reuses the exact same component in `isReadonly` mode instead of a
 * second read-only rendering of the same 7-day grid.
 */
@Component({
  selector: 'app-weekly-schedule-editor',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './weekly-schedule-editor.html',
  styleUrl: './weekly-schedule-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyScheduleEditor {
  private readonly formBuilder = inject(FormBuilder);

  readonly schedule = input<DoctorSchedule | null>(null);
  readonly isReadonly = input(false);
  readonly isSaving = input(false);

  readonly save = output<DoctorScheduleInput>();

  readonly dayNames = DAYS_OF_WEEK;
  readonly dayLabels = DAY_LABELS;
  readonly workingByDay = signal<boolean[]>(DAYS_OF_WEEK.map(() => true));

  readonly form = this.formBuilder.group({
    days: this.formBuilder.array(DAYS_OF_WEEK.map(() => this.buildDayGroup())),
  });

  get dayControls(): DayFormGroup[] {
    return this.form.controls.days.controls;
  }

  constructor() {
    effect(() => {
      const schedule = this.schedule();
      if (schedule) {
        schedule.days.forEach((daySchedule, index) => {
          this.dayControls[index]?.patchValue(daySchedule);
        });
        this.workingByDay.set(schedule.days.map((daySchedule) => daySchedule.isWorking));
      }
    });

    effect(() => {
      if (this.isReadonly()) {
        this.form.disable({ emitEvent: false });
      } else {
        this.form.enable({ emitEvent: false });
      }
    });
  }

  onWorkingToggle(index: number, event: MatSlideToggleChange): void {
    this.workingByDay.update((states) =>
      states.map((state, i) => (i === index ? event.checked : state)),
    );
  }

  submit(): void {
    if (this.form.invalid || this.isSaving()) {
      return;
    }

    const days: DaySchedule[] = this.form
      .getRawValue()
      .days.map((day, index) => ({ day: DAYS_OF_WEEK[index], ...day }));

    this.save.emit({ days });
  }

  private buildDayGroup(): DayFormGroup {
    return this.formBuilder.nonNullable.group({
      isWorking: this.formBuilder.nonNullable.control<boolean>(true),
      morningStart: ['09:00', Validators.required],
      morningEnd: ['13:00', Validators.required],
      afternoonStart: ['14:00', Validators.required],
      afternoonEnd: ['18:00', Validators.required],
    });
  }
}
