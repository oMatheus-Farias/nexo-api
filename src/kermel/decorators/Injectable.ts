import { Registry } from '@kermel/di/Registry';
import type { Constructor } from '@shared/type/Constructor';

export function Injectable(): ClassDecorator {
  return (target) => {
    Registry.getInstance().register(target as unknown as Constructor);
  };
}
