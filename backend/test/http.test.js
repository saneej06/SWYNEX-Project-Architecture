import test from 'node:test';
import assert from 'node:assert/strict';
import { parseId, parseQuery } from '../src/utils/http.js';
import { z } from 'zod';

test('valid IDs are positive integers', () => {
  assert.equal(parseId('42'), 42);
  assert.throws(() => parseId('-1'), /valid positive integer/);
  assert.throws(() => parseId('4.2'), /valid positive integer/);
});
test('request data is validated', () => {
  const schema = z.object({productId: z.coerce.number().int().positive()});
  assert.deepEqual(parseQuery(schema, {productId: '5'}), {productId: 5});
  assert.throws(() => parseQuery(schema, {productId: 'abc'}));
});
