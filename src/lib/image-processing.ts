/**
 * Fonctions de prétraitement d'image pour améliorer la détection VIN
 * Gère : contraste, luminosité, niveaux de gris, réduction de bruit
 */

interface ImageProcessingOptions {
  contrast?: number; // 0-200, 100 = normal
  brightness?: number; // 0-200, 100 = normal
  saturation?: number; // 0-200, 100 = normal
  grayscale?: boolean;
  sharpen?: boolean;
  denoise?: boolean;
}

/**
 * Prétraiter une image depuis un canvas ou file
 */
export async function preprocessImage(
  imageSource: HTMLCanvasElement | File,
  options: ImageProcessingOptions = {}
): Promise<HTMLCanvasElement> {
  let canvas: HTMLCanvasElement;
  const ctx = (canvas = document.createElement("canvas")).getContext("2d");

  if (!ctx) throw new Error("Impossible d'obtenir le contexte 2D du canvas");

  // Charger l'image
  if (imageSource instanceof File) {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = URL.createObjectURL(imageSource);
    });

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
  } else {
    canvas.width = imageSource.width;
    canvas.height = imageSource.height;
    ctx.drawImage(imageSource, 0, 0);
  }

  // Appliquer les transformations
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  imageData = applyProcessing(imageData, options);

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Appliquer les traitements à ImageData
 */
function applyProcessing(
  imageData: ImageData,
  options: ImageProcessingOptions
): ImageData {
  let data = new Uint8ClampedArray(imageData.data);

  // Convertir en niveaux de gris si demandé
  if (options.grayscale) {
    data = applyGrayscale(data);
  }

  // Appliquer contraste
  if (options.contrast && options.contrast !== 100) {
    data = adjustContrast(data, options.contrast);
  }

  // Appliquer luminosité
  if (options.brightness && options.brightness !== 100) {
    data = adjustBrightness(data, options.brightness);
  }

  // Appliquer saturation
  if (options.saturation && options.saturation !== 100) {
    data = adjustSaturation(data, options.saturation);
  }

  // Aiguiser l'image
  if (options.sharpen) {
    data = applySharpen(data, imageData.width, imageData.height);
  }

  // Réduire le bruit
  if (options.denoise) {
    data = applyDenoise(data, imageData.width, imageData.height);
  }

  imageData.data.set(data);
  return imageData;
}

/**
 * Convertir en niveaux de gris (luminance)
 */
function applyGrayscale(data: Uint8ClampedArray): Uint8ClampedArray {
  for (let i = 0; i < data.length; i += 4) {
    // Utiliser la formule ITU-R BT.601
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
    // data[i + 3] est l'alpha, on ne le change pas
  }
  return data;
}

/**
 * Ajuster le contraste
 * Formule : outputPixel = (inputPixel - 128) * factor + 128
 */
function adjustContrast(
  data: Uint8ClampedArray,
  contrast: number
): Uint8ClampedArray {
  const factor = (contrast - 100) / 100 + 1;
  const intercept = 128 * (1 - factor);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] * factor + intercept);
    data[i + 1] = Math.round(data[i + 1] * factor + intercept);
    data[i + 2] = Math.round(data[i + 2] * factor + intercept);
  }
  return data;
}

/**
 * Ajuster la luminosité
 */
function adjustBrightness(
  data: Uint8ClampedArray,
  brightness: number
): Uint8ClampedArray {
  const factor = brightness / 100;
  const delta = (factor - 1) * 255;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, data[i] + delta));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + delta));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + delta));
  }
  return data;
}

/**
 * Ajuster la saturation
 */
function adjustSaturation(
  data: Uint8ClampedArray,
  saturation: number
): Uint8ClampedArray {
  const factor = saturation / 100;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Convertir RGB en HSL
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const l = (max + min) / 2;

    let s = 0;
    let h = 0;

    if (max !== min) {
      s = l < 0.5 ? (max - min) / (max + min) : (max - min) / (2 - max - min);

      if (max === r / 255) {
        h = (60 * (g / 255 - b / 255)) / (max - min) + (g / 255 < b / 255 ? 360 : 0);
      } else if (max === g / 255) {
        h = (60 * (b / 255 - r / 255)) / (max - min) + 120;
      } else {
        h = (60 * (r / 255 - g / 255)) / (max - min) + 240;
      }
    }

    // Augmenter la saturation
    s = Math.min(1, s * factor);

    // Reconvertir en RGB
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    let r_ = 0,
      g_ = 0,
      b_ = 0;

    if (h >= 0 && h < 60) {
      r_ = c;
      g_ = x;
    } else if (h >= 60 && h < 120) {
      r_ = x;
      g_ = c;
    } else if (h >= 120 && h < 180) {
      g_ = c;
      b_ = x;
    } else if (h >= 180 && h < 240) {
      g_ = x;
      b_ = c;
    } else if (h >= 240 && h < 300) {
      r_ = x;
      b_ = c;
    } else if (h >= 300 && h < 360) {
      r_ = c;
      b_ = x;
    }

    const m = l - c / 2;
    data[i] = Math.round((r_ + m) * 255);
    data[i + 1] = Math.round((g_ + m) * 255);
    data[i + 2] = Math.round((b_ + m) * 255);
  }
  return data;
}

/**
 * Aiguiser l'image (kernel Unsharp Mask simplifié)
 */
function applySharpen(
  data: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  const kernelSize = 3;
  const offset = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0;

      for (let dy = -offset; dy <= offset; dy++) {
        for (let dx = -offset; dx <= offset; dx++) {
          const ny = Math.max(0, Math.min(height - 1, y + dy));
          const nx = Math.max(0, Math.min(width - 1, x + dx));
          const idx = (ny * width + nx) * 4;
          const kernelIdx = (dy + offset) * kernelSize + (dx + offset);

          r += data[idx] * kernel[kernelIdx];
          g += data[idx + 1] * kernel[kernelIdx];
          b += data[idx + 2] * kernel[kernelIdx];
        }
      }

      const idx = (y * width + x) * 4;
      output[idx] = Math.max(0, Math.min(255, r));
      output[idx + 1] = Math.max(0, Math.min(255, g));
      output[idx + 2] = Math.max(0, Math.min(255, b));
      output[idx + 3] = data[idx + 3];
    }
  }

  return output;
}

/**
 * Réduire le bruit (Median filter)
 */
function applyDenoise(
  data: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  const radius = 1; // 3x3 kernel

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixels: number[][] = [[], [], []]; // [R, G, B]

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = Math.max(0, Math.min(height - 1, y + dy));
          const nx = Math.max(0, Math.min(width - 1, x + dx));
          const idx = (ny * width + nx) * 4;

          pixels[0].push(data[idx]);
          pixels[1].push(data[idx + 1]);
          pixels[2].push(data[idx + 2]);
        }
      }

      const idx = (y * width + x) * 4;
      output[idx] = median(pixels[0]);
      output[idx + 1] = median(pixels[1]);
      output[idx + 2] = median(pixels[2]);
      output[idx + 3] = data[idx + 3];
    }
  }

  return output;
}

/**
 * Calculer la médiane d'un tableau
 */
function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Appliquer plusieurs niveaux de prétraitement automatiques pour VIN
 */
export async function enhanceForVINDetection(
  imageSource: HTMLCanvasElement | File
): Promise<{
  original: HTMLCanvasElement;
  enhanced1: HTMLCanvasElement;
  enhanced2: HTMLCanvasElement;
  enhanced3: HTMLCanvasElement;
}> {
  const original = imageSource instanceof File
    ? document.createElement("canvas")
    : imageSource;

  if (imageSource instanceof File) {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = URL.createObjectURL(imageSource);
    });

    original.width = img.width;
    original.height = img.height;
    const ctx = original.getContext("2d");
    if (ctx) ctx.drawImage(img, 0, 0);
  }

  // Stratégie 1: Augmenter le contraste et la clarté
  const enhanced1 = await preprocessImage(original, {
    contrast: 150,
    brightness: 110,
    grayscale: false,
    sharpen: true,
  });

  // Stratégie 2: Niveaux de gris + contraste fort
  const enhanced2 = await preprocessImage(original, {
    grayscale: true,
    contrast: 170,
    brightness: 105,
    sharpen: true,
    denoise: true,
  });

  // Stratégie 3: Luminosité réduite + contraste maximum
  const enhanced3 = await preprocessImage(original, {
    contrast: 180,
    brightness: 95,
    grayscale: true,
    sharpen: true,
    denoise: true,
  });

  return { original, enhanced1, enhanced2, enhanced3 };
}

/**
 * Valider un VIN selon la norme ISO 3779
 * VIN = 17 caractères alphanumériques (sauf I, O, Q)
 */
export function validateVIN(vin: string): { valid: boolean; error?: string } {
  const cleanVIN = vin.toUpperCase().trim();

  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleanVIN)) {
    return {
      valid: false,
      error: "Le VIN doit contenir 17 caractères (A-Z sauf I, O, Q et 0-9)",
    };
  }

  // Vérifier le checksum (9ème caractère)
  const checksum = calculateVINChecksum(cleanVIN.substring(0, 8) + cleanVIN.substring(9));
  if (checksum !== parseInt(cleanVIN[8])) {
    return {
      valid: false,
      error: "Le checksum du VIN est invalide",
    };
  }

  return { valid: true };
}

/**
 * Calculer le checksum VIN (formule ISO 3779)
 */
function calculateVINChecksum(vin: string): number {
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  const transliteration: Record<string, number> = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4,
    N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  };

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    if (i === 8) continue; // Skip checksum digit
    const char = vin[i];
    const value = isNaN(Number(char)) ? transliteration[char] : parseInt(char);
    sum += value * weights[i];
  }

  return sum % 11 === 10 ? 0 : sum % 11;
}
