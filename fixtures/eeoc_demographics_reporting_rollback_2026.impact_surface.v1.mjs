import legislativeConsequenceFixture from './eeoc_demographics_reporting_rollback_2026.complete.v1.mjs';
import classificationManifest from '../manifests/eeoc_demographics_reporting_rollback_2026.impact_classification.v1.json' with { type: 'json' };
import { buildLegislativeImpactSurface } from '../src/legislative-impact-surface.mjs';

const { impact_surface, receipt } = buildLegislativeImpactSurface(
  legislativeConsequenceFixture,
  classificationManifest
);

export { impact_surface, receipt };

export default {
  fixture_id: 'legislative_consequence_eeoc_demographics_reporting_rollback_2026.impact_surface.v1',
  fixture_version: '1.0.0',
  stage: 3,
  stage_name: 'impact_surface',
  source_stage_1_2_fixture_id: legislativeConsequenceFixture.fixture_id,
  classification_manifest_id: classificationManifest.manifest_id,
  impact_surface,
  receipt,
  atlas_historical_compare: null,
  lighthouse_accountability_view: null,
  instantiated_checklist: null,
  projection_executed: false,
  database_persisted: false
};
