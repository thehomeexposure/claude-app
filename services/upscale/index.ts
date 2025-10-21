import { UpScalerService, UpScaleProvider } from './types';
import { DummyUpScaler } from './dummy';

export * from './types';

const services: Record<UpScaleProvider, UpScalerService> = {
  dummy: new DummyUpScaler(),
  'real-esrgan': new DummyUpScaler(), // Use dummy for now
};

export const getUpScaler = (
  provider: UpScaleProvider = 'dummy'
): UpScalerService => {
  return services[provider];
};
