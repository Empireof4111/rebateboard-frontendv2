export type ShareableExportOptions = {
  backgroundColor?: string;
  pixelRatio?: number;
  targetWidth?: number;
  targetHeight?: number;
};

export async function exportElementToCanvas(
  element: HTMLElement,
  options: ShareableExportOptions = {},
): Promise<HTMLCanvasElement> {
  const {
    backgroundColor = "transparent",
    pixelRatio = 2,
    targetWidth,
    targetHeight,
  } = options;

  await document.fonts?.ready;
  await waitForImages(element);
  await waitForNextPaint();

  const { toCanvas } = await import("html-to-image");
  const sourceCanvas = await toCanvas(element, {
    pixelRatio,
    backgroundColor,
    cacheBust: true,
  });

  if (!targetWidth || !targetHeight) return sourceCanvas;

  const output = document.createElement("canvas");
  output.width = targetWidth;
  output.height = targetHeight;
  const context = output.getContext("2d");
  if (!context) return sourceCanvas;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, targetWidth, targetHeight);
  context.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
  return output;
}

export async function exportElementToPngBlob(
  element: HTMLElement,
  options: ShareableExportOptions = {},
): Promise<Blob | null> {
  const canvas = await exportElementToCanvas(element, options);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 1);
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.download = filename;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
}

export function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });
}

export async function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map((image) => {
      if (image.complete && image.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        image.onload = () => resolve();
        image.onerror = () => resolve();
      });
    }),
  );
}
