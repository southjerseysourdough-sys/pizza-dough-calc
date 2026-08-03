/**
 * Small, domain-agnostic type helpers shared across the app.
 * Domain models belong next to the feature that owns them, not here.
 */

export type Nullable<T> = T | null;

export type Maybe<T> = T | null | undefined;

/** Widens a literal union while keeping editor autocomplete for known members. */
export type LooseAutocomplete<T extends string> = T | (string & {});

export type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

/** Marks a subset of keys required on an otherwise partial type. */
export type RequireKeys<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

export type ThemeMode = "light" | "dark" | "system";
