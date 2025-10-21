export interface UpScalerService {
  upscale(imageBuffer: Buffer, scale?: number): Promise<Buffer>;
}

export type UpScaleProvider = 'dummy' | 'real-esrgan';
