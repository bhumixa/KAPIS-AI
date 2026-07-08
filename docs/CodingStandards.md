# Coding Standards

These are enforced in review (and partly by `ng lint`/`tsc`), not just suggestions.

## TypeScript

- **Strict mode is on** (`tsconfig.json` - `strict: true` plus Angular's
  `strictTemplates`/`strictInjectionParameters`). Don't weaken it.
- **No `any`.** Use a real interface, a generic, or `unknown` + a narrowing check. If
  you're reaching for `any` because a shape is genuinely dynamic, define an interface
  for the parts you actually use.
- **Every function boundary is typed** - parameters and return types, even when
  inference would work, if the inferred type isn't obvious at the call site.
- **Prefer `interface` for object shapes**, `type` for unions/intersections/utility
  compositions.
- **`readonly` by default** on class fields and array/object properties that shouldn't
  be reassigned after construction (see every service/guard in `core/`).

## Angular

- **Standalone components only** - no `NgModule`s. Every component declares its own
  `imports: [...]`.
- **`ChangeDetectionStrategy.OnPush`** on every component. Signals + OnPush is the
  default combination in this codebase; if a component needs default change detection,
  that's a sign it's reaching for something it shouldn't (e.g. mutating an object
  in place instead of using a signal).
- **Signals for component/service state**, RxJS for async streams and event
  composition. Don't wrap a signal in an `Observable` or vice versa without a reason -
  `toSignal`/`toObservable` exist for the boundary.
- **Functional guards/interceptors** (`CanActivateFn`, `HttpInterceptorFn`) using
  `inject()`, not class-based - matches Angular's current default and avoids DI
  constructor boilerplate.
- **`inject()` over constructor injection** for consistency across the codebase (also
  required for signal field initializers that depend on an injected service - see
  `AuthService`).

## Structure & reuse

- **SOLID at the module boundary**: a service does one job (`TokenStorageService` only
  touches storage; it doesn't also validate credentials). A component orchestrates; it
  doesn't reimplement logic that belongs in a service.
- **No duplicated logic.** If you're about to copy a template block or a validation
  rule, extract it - `ComingSoon` exists specifically so four nav items don't need four
  near-identical components.
- **Don't build for hypothetical futures.** Add the abstraction when the second real
  use case shows up, not before. (Sprint 1's exception: the auth/interceptor plumbing,
  which exists now because retrofitting auth into every HTTP call site later is far
  more expensive than wiring it once, unused, today.)
- **Meaningful names over comments.** A well-named function/variable doesn't need a
  comment restating what it does; a comment should explain a non-obvious *why*.

## Naming (see also `docs/FolderStructure.md`)

- Components: `<name>.ts/.html/.scss`, class `PascalCase` matching the folder
  (`features/auth/login/login.ts` -> `export class Login`).
- Services/guards/interceptors/models/constants/utils keep their suffix:
  `.service.ts`, `.guard.ts`, `.interceptor.ts`, `.model.ts`, `.constant.ts`, `.util.ts`.
- Folders are lowercase-kebab, named after the capability they contain
  (`features/appointments/`, not `features/appt/` or `features/Appointments/`).

## Formatting & linting

- **Prettier** formats; don't hand-format against it. Run `npm run format` before
  committing, or configure your editor to format on save.
- **ESLint** (`@angular-eslint`) must pass with zero errors before a PR is opened
  (`npm run lint`). Don't disable a rule inline without a comment explaining why.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):
`type(scope): summary`, imperative mood, explaining *why* when it's not obvious from
the diff. Examples: `feat(dashboard): add quick actions grid`,
`fix(auth): correct returnUrl redirect after login`,
`docs(architecture): explain M3 theme generation`.
