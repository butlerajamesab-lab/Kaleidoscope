import scenario from './local-preemption-family-scenario.v1.json' with { type: 'json' };
import mechanismBundle from './local-preemption-family-mechanisms.v1.json' with { type: 'json' };
import baseline from './local-preemption-family-baseline.v1.json' with { type: 'json' };
import changed from './local-preemption-family-changed.v1.json' with { type: 'json' };

export default {
  ...scenario,
  mechanisms: mechanismBundle.mechanisms,
  relationships: mechanismBundle.relationships,
  baseline,
  changed
};
