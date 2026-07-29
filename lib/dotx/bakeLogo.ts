export type BakedImage = {
  dataUrl: string;
  width: number;
  height: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the logo image."));
    img.src = src;
  });
}

/**
 * Bakes the brightness/contrast/saturation adjustments (applied only as a CSS
 * filter in the live preview) into real pixels via canvas, since the .dotx
 * file has no equivalent of a CSS filter — RamSoft/Word only ever see the
 * final baked bytes.
 */
export async function bakeLogoImage(
  dataUrl: string,
  adjustments: { brightness: number; contrast: number; saturation: number },
): Promise<BakedImage> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable in this browser.");
  }
  ctx.filter = `brightness(${adjustments.brightness}) contrast(${adjustments.contrast}) saturate(${adjustments.saturation})`;
  ctx.drawImage(img, 0, 0);
  return {
    dataUrl: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
  };
}

export function fitDimensions(
  natural: { width: number; height: number },
  max: { width: number; height: number },
): { width: number; height: number } {
  const scale = Math.min(
    max.width / natural.width,
    max.height / natural.height,
    1,
  );
  return {
    width: Math.round(natural.width * scale),
    height: Math.round(natural.height * scale),
  };
}
