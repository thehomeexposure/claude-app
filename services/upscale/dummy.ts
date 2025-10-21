import { UpScalerService } from './types';

export class DummyUpScaler implements UpScalerService {
  async upscale(imageBuffer: Buffer, scale: number = 2): Promise<Buffer> {
    // Dummy implementation - just returns the same buffer
    // In a real implementation, this would upscale the image
    console.log(`[DummyUpScaler] Simulating ${scale}x upscale...`);

    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return the same buffer (no actual upscaling)
    return imageBuffer;
  }
}
