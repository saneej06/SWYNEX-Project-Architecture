export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function parseId(raw) {
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) throw httpError(400, 'A valid positive integer ID is required.');
  return id;
}

export function parseQuery(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) throw httpError(400, result.error.issues[0]?.message || 'Invalid request.');
  return result.data;
}
