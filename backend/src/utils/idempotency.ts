export const isValidIdempotencyKey=(v:unknown):v is string=>typeof v==='string'&&/^[A-Za-z0-9_-]{16,128}$/.test(v)
