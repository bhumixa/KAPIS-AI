import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TimeSlot } from '../../../doctors/models/time-slot.model';

/**
 * Presentational grid of clickable time slots - shared by the booking wizard
 * (`AppointmentBook`) and `AppointmentEdit`'s reschedule step, so the two
 * flows don't each re-implement "render slots, highlight the selected one".
 */
@Component({
  selector: 'app-slot-picker',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './slot-picker.html',
  styleUrl: './slot-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlotPicker {
  readonly slots = input.required<TimeSlot[]>();
  readonly selectedSlot = input<TimeSlot | null>(null);

  readonly slotSelected = output<TimeSlot>();

  isSelected(slot: TimeSlot): boolean {
    const selected = this.selectedSlot();
    return !!selected && selected.start === slot.start && selected.end === slot.end;
  }
}
