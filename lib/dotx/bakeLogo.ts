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

/** Pixels lighter than this on every channel count as background. */
const WHITE_THRESHOLD = 247;
const ALPHA_THRESHOLD = 8;
const TRIM_PAD = 4;

type Box = { left: number; top: number; right: number; bottom: number };

/**
 * Finds the bounding box of non-white, non-transparent pixels. Facility logos
 * routinely arrive with large blank margins baked in; embedding them untrimmed
 * makes the header mostly empty space around a tiny mark.
 */
function findContentBox(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): Box | null {
  const { data } = ctx.getImageData(0, 0, width, height);
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3];
      if (alpha < ALPHA_THRESHOLD) continue;
      const isWhite =
        data[i] >= WHITE_THRESHOLD &&
        data[i + 1] >= WHITE_THRESHOLD &&
        data[i + 2] >= WHITE_THRESHOLD;
      if (isWhite) continue;

      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }

  if (right < 0 || bottom < 0) return null;
  return {
    left: Math.max(0, left - TRIM_PAD),
    top: Math.max(0, top - TRIM_PAD),
    right: Math.min(width - 1, right + TRIM_PAD),
    bottom: Math.min(height - 1, bottom + TRIM_PAD),
  };
}

/**
 * Bakes the brightness/contrast/saturation adjustments (applied only as a CSS
 * filter in the live preview) into real pixels via canvas, since the .dotx
 * file has no equivalent of a CSS filter — RamSoft/Word only ever see the
 * final baked bytes. Also trims surrounding whitespace.
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

  const box = findContentBox(ctx, canvas.width, canvas.height);
  if (!box) {
    // Fully blank image — nothing to trim, keep it as-is rather than erroring.
    return {
      dataUrl: canvas.toDataURL("image/png"),
      width: canvas.width,
      height: canvas.height,
    };
  }

  const cropWidth = box.right - box.left + 1;
  const cropHeight = box.bottom - box.top + 1;
  if (cropWidth === canvas.width && cropHeight === canvas.height) {
    return {
      dataUrl: canvas.toDataURL("image/png"),
      width: canvas.width,
      height: canvas.height,
    };
  }

  const cropped = document.createElement("canvas");
  cropped.width = cropWidth;
  cropped.height = cropHeight;
  const croppedCtx = cropped.getContext("2d");
  if (!croppedCtx) {
    throw new Error("Canvas 2D context is unavailable in this browser.");
  }
  croppedCtx.drawImage(
    canvas,
    box.left,
    box.top,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight,
  );

  return {
    dataUrl: cropped.toDataURL("image/png"),
    width: cropWidth,
    height: cropHeight,
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
