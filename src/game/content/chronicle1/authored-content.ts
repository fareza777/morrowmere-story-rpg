/**
 * Authored catalogs use readable string literals for IDs; runtime content uses
 * branded string types. This keeps every other structural/literal constraint
 * checked at the catalog boundary while deferring reference validity to the
 * content validator.
 */
export type AuthoredContent<T> =
  T extends { readonly __brand: string } ? string
    : T extends { readonly __eventId: unknown } ? string
      : T extends readonly (infer Entry)[] ? readonly AuthoredContent<Entry>[]
        : T extends object ? { readonly [Key in keyof T]: AuthoredContent<T[Key]> }
          : T;
