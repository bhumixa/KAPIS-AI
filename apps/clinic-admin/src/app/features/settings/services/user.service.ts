import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of, tap, throwError } from 'rxjs';
import { ClinicUser, ClinicUserInput, UserRole } from '../models/clinic-user.model';
import {
  PERMISSION_MODULES,
  PermissionActions,
  PermissionModule,
  RolePermission,
} from '../models/permission.model';

// Ids are fixed real UUIDs, not arbitrary mock strings, since Sprint 16 - see
// database/seed/002_conversation_engine_seed.sql - seeded clinic.users rows
// with these exact ids. Settings/Users still has no backend module of its
// own (this list is still mock, unchanged otherwise), but Conversations'
// Assignment feature is real and its assignedToUserId is a genuine FK into
// clinic.users, so whichever id this dropdown submits has to exist there.
function createMockUsers(): ClinicUser[] {
  const now = new Date().toISOString();

  return [
    {
      id: '4584e8bf-a157-4be1-bec1-20fceeaec66e',
      name: 'Admin User',
      email: 'admin@kapis.clinic',
      phone: '+91 90000 00001',
      role: 'admin',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '8473bf7e-0b18-4548-bdcb-95ed6d8e5667',
      name: 'Fatima Rizvi',
      email: 'fatima.rizvi@kapis.clinic',
      phone: '+91 90000 00002',
      role: 'receptionist',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'f1dc00b2-27f5-4b07-b26b-9a81c75da514',
      name: 'Dr. Aisha Khan',
      email: 'aisha.khan@kapis.clinic',
      phone: '+91 98765 43210',
      role: 'doctor',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '354b148c-f4ed-4c9a-b3ce-263c9f69ba3b',
      name: 'Dr. Rohan Mehta',
      email: 'rohan.mehta@kapis.clinic',
      phone: '+91 98765 43211',
      role: 'doctor',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '7674e5c9-6565-435f-8113-058a36f601be',
      name: 'Vikas Nair',
      email: 'vikas.nair@kapis.clinic',
      phone: '+91 90000 00005',
      role: 'receptionist',
      status: 'inactive',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function actions(view: boolean, create: boolean, update: boolean, del: boolean): PermissionActions {
  return { view, create, update, delete: del };
}

const FULL_ACCESS = actions(true, true, true, true);
const NO_ACCESS = actions(false, false, false, false);
const VIEW_ONLY = actions(true, false, false, false);

const RECEPTIONIST_ACCESS: Record<PermissionModule, PermissionActions> = {
  dashboard: VIEW_ONLY,
  doctors: VIEW_ONLY,
  patients: actions(true, true, true, false),
  appointments: actions(true, true, true, false),
  schedule: VIEW_ONLY,
  settings: NO_ACCESS,
  ai: NO_ACCESS,
  whatsapp: NO_ACCESS,
  reports: VIEW_ONLY,
};

const DOCTOR_ACCESS: Record<PermissionModule, PermissionActions> = {
  dashboard: VIEW_ONLY,
  doctors: VIEW_ONLY,
  patients: actions(true, false, true, false),
  appointments: actions(true, false, true, false),
  schedule: actions(true, false, true, false),
  settings: NO_ACCESS,
  ai: NO_ACCESS,
  whatsapp: NO_ACCESS,
  reports: VIEW_ONLY,
};

const DEVELOPER_ACCESS: Record<PermissionModule, PermissionActions> = {
  dashboard: VIEW_ONLY,
  doctors: NO_ACCESS,
  patients: NO_ACCESS,
  appointments: NO_ACCESS,
  schedule: NO_ACCESS,
  settings: NO_ACCESS,
  ai: FULL_ACCESS,
  whatsapp: FULL_ACCESS,
  reports: NO_ACCESS,
};

const ROLE_DEFAULTS: Record<UserRole, Record<PermissionModule, PermissionActions> | null> = {
  admin: null, // every module gets FULL_ACCESS - built below instead of repeated per module
  receptionist: RECEPTIONIST_ACCESS,
  doctor: DOCTOR_ACCESS,
  developer: DEVELOPER_ACCESS,
};

function createMockRolePermissions(): RolePermission[] {
  const roles: UserRole[] = ['admin', 'receptionist', 'doctor', 'developer'];

  return roles.flatMap((role) =>
    PERMISSION_MODULES.map((module) => ({
      role,
      module,
      actions: ROLE_DEFAULTS[role]?.[module] ?? FULL_ACCESS,
    })),
  );
}

/**
 * Owns both User Management (mock CRUD, same signal-plus-Observable shape as
 * `DoctorService`) and Roles & Permissions - kept in one service because a
 * permission is meaningless without the role vocabulary users are assigned
 * from, and splitting them would mean two services always read together.
 * "No authentication changes yet" per the brief: nothing here is consulted
 * by `authGuard`/`AuthService` - it's a configuration surface only.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly _users = signal<ClinicUser[]>(createMockUsers());
  private readonly _rolePermissions = signal<RolePermission[]>(createMockRolePermissions());

  readonly users = this._users.asReadonly();
  readonly userCount = computed(() => this._users().length);
  readonly rolePermissions = this._rolePermissions.asReadonly();
  readonly roles: readonly UserRole[] = ['admin', 'receptionist', 'doctor', 'developer'];

  getUsers(): Observable<ClinicUser[]> {
    return of(this._users()).pipe(delay(300));
  }

  getUser(id: string): Observable<ClinicUser | undefined> {
    return of(this._users().find((user) => user.id === id)).pipe(delay(300));
  }

  createUser(input: ClinicUserInput): Observable<ClinicUser> {
    const now = new Date().toISOString();
    const user: ClinicUser = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };

    return of(user).pipe(
      delay(300),
      tap((created) => this._users.update((users) => [...users, created])),
    );
  }

  updateUser(id: string, input: ClinicUserInput): Observable<ClinicUser> {
    const existing = this._users().find((user) => user.id === id);
    if (!existing) {
      return throwError(() => new Error(`User "${id}" was not found.`));
    }

    const updated: ClinicUser = { ...existing, ...input, updatedAt: new Date().toISOString() };

    return of(updated).pipe(
      delay(300),
      tap((user) => this._users.update((users) => users.map((u) => (u.id === id ? user : u)))),
    );
  }

  deleteUser(id: string): Observable<void> {
    return of(undefined).pipe(
      delay(300),
      tap(() => this._users.update((users) => users.filter((user) => user.id !== id))),
    );
  }

  /** Plain sync read - the permission matrix table reads this directly, same as `AvailabilityService`'s derived getters. */
  getRolePermissions(role: UserRole): RolePermission[] {
    return this._rolePermissions().filter((permission) => permission.role === role);
  }

  updateRolePermission(
    role: UserRole,
    module: PermissionModule,
    permissionActions: PermissionActions,
  ): Observable<RolePermission> {
    const updated: RolePermission = { role, module, actions: permissionActions };

    return of(updated).pipe(
      delay(200),
      tap((permission) =>
        this._rolePermissions.update((permissions) =>
          permissions.map((p) =>
            p.role === permission.role && p.module === permission.module ? permission : p,
          ),
        ),
      ),
    );
  }
}
