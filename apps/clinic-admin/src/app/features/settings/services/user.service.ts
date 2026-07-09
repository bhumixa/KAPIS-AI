import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of, tap, throwError } from 'rxjs';
import { ClinicUser, ClinicUserInput, UserRole } from '../models/clinic-user.model';
import {
  PERMISSION_MODULES,
  PermissionActions,
  PermissionModule,
  RolePermission,
} from '../models/permission.model';

function createMockUsers(): ClinicUser[] {
  const now = new Date().toISOString();

  return [
    {
      id: 'user-1',
      name: 'Admin User',
      email: 'admin@kapis.clinic',
      phone: '+91 90000 00001',
      role: 'admin',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-2',
      name: 'Fatima Rizvi',
      email: 'fatima.rizvi@kapis.clinic',
      phone: '+91 90000 00002',
      role: 'receptionist',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-3',
      name: 'Dr. Aisha Khan',
      email: 'aisha.khan@kapis.clinic',
      phone: '+91 98765 43210',
      role: 'doctor',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-4',
      name: 'Dr. Rohan Mehta',
      email: 'rohan.mehta@kapis.clinic',
      phone: '+91 98765 43211',
      role: 'doctor',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-5',
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

const ROLE_DEFAULTS: Record<UserRole, Record<PermissionModule, PermissionActions> | null> = {
  admin: null, // every module gets FULL_ACCESS - built below instead of repeated per module
  receptionist: RECEPTIONIST_ACCESS,
  doctor: DOCTOR_ACCESS,
};

function createMockRolePermissions(): RolePermission[] {
  const roles: UserRole[] = ['admin', 'receptionist', 'doctor'];

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
  readonly roles: readonly UserRole[] = ['admin', 'receptionist', 'doctor'];

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
