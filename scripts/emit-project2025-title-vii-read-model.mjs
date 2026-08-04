import { writeFile } from 'node:fs/promises';
import fixture from '../fixtures/project2025-title-vii-vertical-slice.v1.mjs';
import civilRights from '../lenses/civil_rights.v1.json' with { type: 'json' };
import enforcement from '../lenses/enforcement_pathways.v1.json' with { type: 'json' };
import localPreemption from '../lenses/local_government_preemption.v1.json' with { type: 'json' };
import affectedPopulations from '../lenses/affected_populations.v1.json' with { type: 'json' };
import { executeProject2025VerticalSlice } from '../src/project2025-vertical-slice.mjs';

const result = executeProject2025VerticalSlice(
  fixture,
  [civilRights, enforcement, localPreemption, affectedPopulations]
);
await writeFile(
  new URL('../fixtures/project2025-title-vii-read-model.v1.json', import.meta.url),
  `${JSON.stringify(result.read_model, null, 2)}\n`,
  'utf8'
);
await writeFile(
  new URL('../fixtures/project2025-title-vii-receipt.v1.json', import.meta.url),
  `${JSON.stringify(result.receipt, null, 2)}\n`,
  'utf8'
);
console.log(JSON.stringify({
  run_id: result.receipt.run_id,
  projection_bundle_hash: result.bundle.projection_bundle_hash,
  read_model_hash: result.read_model.read_model_hash,
  receipt_hash: result.receipt.receipt_hash
}));
