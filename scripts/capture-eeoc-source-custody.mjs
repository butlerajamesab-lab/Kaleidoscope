import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve('artifacts/eeoc-source-custody');
const SOURCES = [
  {
    source_id: 'eeoc_nprm_rin_3046_ab37_2026_07_21',
    filename: 'eeoc_2026_nprm_rin_3046_ab37.pdf',
    url: 'https://www.eeoc.gov/sites/default/files/2026-07/2026_NL01498_NPRM_Rescission.pdf'
  },
  {
    source_id: 'ecfr_title_29_part_1602_2026_07_31',
    filename: 'ecfr_title_29_part_1602_2026_07_31.xml',
    url: 'https://www.ecfr.gov/api/versioner/v1/full/2026-07-31/title-29.xml?part=1602'
  },
  {
    source_id: 'colorado_hb26_1207_signed_act_2026_06_04',
    filename: 'colorado_hb26_1207_signed_act.pdf',
    url: 'https://www.leg.colorado.gov/bill_files/117148/download'
  },
  {
    source_id: 'eeoc_press_release_2026_07_21',
    filename: 'eeoc_press_release_2026_07_21.html',
    url: 'https://www.eeoc.gov/newsroom/eeoc-proposes-rescission-annual-race-and-sex-reporting-requirements'
  }
];

await mkdir(OUT, { recursive: true });
const receipt = {
  receipt_id: 'eeoc_demographics_reporting_rollback_source_custody_2026_08_04',
  receipt_version: '1.0.0',
  capture_method: 'github_actions_fetch_exact_official_urls',
  sources: []
};

for (const source of SOURCES) {
  const response = await fetch(source.url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Luminari-Kaleidoscope-Source-Custody/1.0',
      accept: '*/*'
    }
  });
  if (!response.ok) {
    throw new Error(`source_fetch_failed:${source.source_id}:${response.status}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0) throw new Error(`empty_source:${source.source_id}`);
  const digest = createHash('sha256').update(bytes).digest('hex');
  await writeFile(path.join(OUT, source.filename), bytes);
  receipt.sources.push({
    source_id: source.source_id,
    requested_url: source.url,
    final_url: response.url,
    filename: source.filename,
    content_type: response.headers.get('content-type'),
    byte_length: bytes.length,
    sha256: digest
  });
}

receipt.source_count = receipt.sources.length;
await writeFile(
  path.join(OUT, 'source-custody.json'),
  `${JSON.stringify(receipt, null, 2)}\n`,
  'utf8'
);
console.log(JSON.stringify(receipt));
