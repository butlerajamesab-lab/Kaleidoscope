import scenario from './project2025-title-vii-scenario.v1.json' with { type: 'json' };
import mechanismBundle from './project2025-title-vii-mechanisms.v1.json' with { type: 'json' };
import baseline from './project2025-title-vii-baseline.v1.json' with { type: 'json' };
import changed from './project2025-title-vii-changed.v1.json' with { type: 'json' };

export default {
  ...scenario,
  mechanisms: mechanismBundle.mechanisms,
  relationships: mechanismBundle.relationships,
  baseline,
  changed
};
