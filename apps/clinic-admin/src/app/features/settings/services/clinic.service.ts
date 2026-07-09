import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of, tap } from 'rxjs';
import { ClinicProfile, ClinicProfileInput } from '../models/clinic-profile.model';
import { BusinessHours, BusinessHoursInput } from '../models/business-hours.model';
import { DAYS_OF_WEEK } from '../../doctors/models/doctor-schedule.model';
import {
  getDayOfWeek,
  timeToMinutes,
  toIsoDate,
} from '../../doctors/schedule/utils/schedule-date.util';

function createMockClinicProfile(): ClinicProfile {
  const now = new Date().toISOString();

  return {
    id: 'clinic-1',
    clinicName: 'Kapis Clinic AI',
    logoUrl: '',
    registrationNumber: 'CLINIC-REG-00123',
    taxId: '',
    address: '221B Health Avenue',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    postalCode: '400001',
    phone: '+91 22 4000 1234',
    email: 'front-desk@kapis.clinic',
    website: 'https://kapis.clinic',
    timeZone: 'Asia/Kolkata',
    currency: 'INR',
    language: 'English',
    createdAt: now,
    updatedAt: now,
  };
}

const STANDARD_HOURS: Pick<
  BusinessHours['days'][number],
  'openTime' | 'closeTime' | 'lunchBreakStart' | 'lunchBreakEnd'
> = {
  openTime: '09:00',
  closeTime: '18:00',
  lunchBreakStart: '13:00',
  lunchBreakEnd: '14:00',
};

function createMockBusinessHours(): BusinessHours {
  return {
    days: DAYS_OF_WEEK.map((day) => ({
      day,
      isOpen: day !== 'sunday',
      ...STANDARD_HOURS,
    })),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Owns the clinic's own identity + weekly opening hours - the two Sprint 6
 * entities the dashboard needs ("Clinic Name", "Current Time Zone",
 * "Business Status") to render a live banner. Same signal-plus-Observable
 * split as `DoctorService`; `getClinicProfile()`/`updateClinicProfile()` and
 * `getBusinessHours()`/`updateBusinessHours()` are get/update pairs (not full
 * CRUD) since both are singleton config, not a list - the same shape
 * `ScheduleService.getSchedule()`/`updateSchedule()` already used for a
 * per-doctor singleton.
 */
@Injectable({ providedIn: 'root' })
export class ClinicService {
  private readonly _clinicProfile = signal<ClinicProfile>(createMockClinicProfile());
  private readonly _businessHours = signal<BusinessHours>(createMockBusinessHours());

  readonly clinicProfile = this._clinicProfile.asReadonly();
  readonly businessHours = this._businessHours.asReadonly();

  /**
   * Ignores true IANA timezone conversion (same local-time simplification
   * Sprint 3's schedule utils already made) - good enough for a single-region
   * clinic deployment today.
   */
  readonly isOpenNow = computed(() => {
    const now = new Date();
    const today = getDayOfWeek(toIsoDate(now));
    const daySchedule = this._businessHours().days.find((d) => d.day === today);
    if (!daySchedule || !daySchedule.isOpen) {
      return false;
    }

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const isWithinOpenHours =
      nowMinutes >= timeToMinutes(daySchedule.openTime) &&
      nowMinutes < timeToMinutes(daySchedule.closeTime);
    const isDuringLunch =
      nowMinutes >= timeToMinutes(daySchedule.lunchBreakStart) &&
      nowMinutes < timeToMinutes(daySchedule.lunchBreakEnd);

    return isWithinOpenHours && !isDuringLunch;
  });

  getClinicProfile(): Observable<ClinicProfile> {
    return of(this._clinicProfile()).pipe(delay(300));
  }

  updateClinicProfile(input: ClinicProfileInput): Observable<ClinicProfile> {
    const updated: ClinicProfile = {
      ...this._clinicProfile(),
      ...input,
      updatedAt: new Date().toISOString(),
    };

    return of(updated).pipe(
      delay(300),
      tap((profile) => this._clinicProfile.set(profile)),
    );
  }

  getBusinessHours(): Observable<BusinessHours> {
    return of(this._businessHours()).pipe(delay(300));
  }

  updateBusinessHours(input: BusinessHoursInput): Observable<BusinessHours> {
    const updated: BusinessHours = { days: input.days, updatedAt: new Date().toISOString() };

    return of(updated).pipe(
      delay(300),
      tap((hours) => this._businessHours.set(hours)),
    );
  }
}
