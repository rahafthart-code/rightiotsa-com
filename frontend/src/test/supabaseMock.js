// Minimal chainable mock for the Supabase query builder. Every method call
// returns the same chainable object so tests don't need to replicate the
// exact `.select().eq().order().limit()` chain shape; `.maybeSingle()`
// resolves explicitly, and the chain itself is awaitable (thenable) for
// queries that terminate mid-chain (e.g. `{ count: 'exact', head: true }`).
export function chainableResponse(response) {
  const node = {
    select: () => node,
    insert: () => node,
    update: () => node,
    upsert: () => node,
    eq: () => node,
    or: () => node,
    order: () => node,
    limit: () => node,
    single: () => Promise.resolve(response),
    maybeSingle: () => Promise.resolve(response),
    then: (resolve, reject) => Promise.resolve(response).then(resolve, reject),
  };
  return node;
}

// Build a `supabase.from(table)` mock keyed by table name.
// `responses` maps table name -> response object (e.g. { data }, { count }).
export function mockSupabaseFrom(responses) {
  return (table) => chainableResponse(responses[table] ?? { data: null, count: 0, error: null });
}
