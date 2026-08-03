import { createHash } from 'node:crypto';
import { canonicalize } from './canonical-json.mjs';

export function sha256Hex(value) {
  return createHash('sha256').update(canonicalize(value), 'utf8').digest('hex');
}
