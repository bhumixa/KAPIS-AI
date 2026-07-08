export type LeaveType = 'vacation' | 'sick' | 'emergency' | 'conference' | 'other';

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  vacation: 'Vacation',
  sick: 'Sick Leave',
  emergency: 'Emergency',
  conference: 'Conference',
  other: 'Other',
};

export interface DoctorLeave {
  id: string;
  doctorId: string;
  type: LeaveType;
  /** ISO date ("yyyy-MM-dd"), inclusive. */
  startDate: string;
  /** ISO date ("yyyy-MM-dd"), inclusive. */
  endDate: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export type DoctorLeaveInput = Omit<DoctorLeave, 'id' | 'createdAt' | 'updatedAt'>;
