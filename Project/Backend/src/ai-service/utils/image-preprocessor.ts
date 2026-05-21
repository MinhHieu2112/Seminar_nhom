import { Jimp } from 'jimp';

/**
 * Preprocesses an image buffer before OCR to improve handwritten Vietnamese recognition.
 * Applies greyscale, auto-contrast (normalize), contrast boost, denoise (via convolution),
 * sharpening, and dynamic threshold binarization.
 */
export async function preprocessImageForOcr(
  imageBuffer: Buffer,
): Promise<Buffer> {
  // Read the image buffer
  const image = await Jimp.read(imageBuffer);

  // 1. Grayscale
  image.greyscale();

  // 2. Auto Contrast / Normalize (stretches contrast to full dynamic range)
  image.normalize();

  // 3. Additional contrast boost to push handwriting and backgrounds apart
  image.contrast(0.4);

  // 4. Sharpen (helps preserve edge definition of handwritten strokes)
  const sharpenKernel = [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ];
  image.convolution(sharpenKernel);

  // 5. Dynamic Threshold Binarization
  let sum = 0;
  let count = 0;

  // Calculate average brightness
  image.scan(
    0,
    0,
    image.bitmap.width,
    image.bitmap.height,
    (x: number, y: number, idx: number) => {
      sum += image.bitmap.data[idx];
      count++;
    },
  );

  const avg = count > 0 ? sum / count : 128;
  // Adaptive threshold adjustment: use avg - 25 to isolate text from background
  const threshold = Math.max(80, Math.min(180, avg - 25));

  // Apply binarization
  image.scan(
    0,
    0,
    image.bitmap.width,
    image.bitmap.height,
    (x: number, y: number, idx: number) => {
      const val = image.bitmap.data[idx];
      const newVal = val < threshold ? 0 : 255;
      image.bitmap.data[idx] = newVal;
      image.bitmap.data[idx + 1] = newVal;
      image.bitmap.data[idx + 2] = newVal;
    },
  );

  // Export processed image to PNG buffer
  return await image.getBuffer('image/png');
}
