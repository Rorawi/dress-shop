export async function optimizePhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image.`);
  if (file.size > 25 * 1024 * 1024) throw new Error(`${file.name} is larger than 25 MB.`);
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not process this image in your browser.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error(`Could not convert ${file.name} to WebP.`)), "image/webp", 0.84));
  if (blob.size > 7.5 * 1024 * 1024) throw new Error(`${file.name} is still too large after optimization. Try a smaller photo.`);
  return blob;
}
