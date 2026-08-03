# Features

Vertical slices. Each folder owns one product capability end to end and is the
default home for new code — `components/`, `hooks/`, `store/` and `lib/` at the
top level are for things genuinely shared by two or more features.

```
features/
  <feature>/
    components/    UI specific to this feature
    hooks/         stateful logic specific to this feature
    lib/           pure domain logic (calculations, transforms)
    schema.ts      zod schemas + inferred types
    store.ts       zustand store, if the feature needs one
    types.ts       domain models
    index.ts       the feature's public surface
```

## Rules

- **Import across features only through `index.ts`.** Deep imports into another
  feature's internals make slices impossible to move or delete.
- **Routes stay thin.** `app/**/page.tsx` handles routing, metadata and layout;
  it composes a feature rather than implementing one.
- **Push domain logic into `lib/`.** Keeping calculations as pure functions,
  separate from components, is what makes them straightforward to unit test.
- **Promote to the top level only on the second consumer.** Shared-by-default
  is how a foundation turns into a tangle.
