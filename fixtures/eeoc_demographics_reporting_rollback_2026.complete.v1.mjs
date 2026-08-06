import baseFixture from './eeoc_demographics_reporting_rollback_2026.v1.mjs';
import legislationPlatformBindings from '../source_bundles/eeoc_demographics_reporting_rollback_2026.legislation_sources.v1.json' with { type: 'json' };

export default {
  ...baseFixture,
  legislation_platform_bindings: legislationPlatformBindings
};
