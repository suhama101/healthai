export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,.jpg,.jpeg,.png";

const signatures: Record<string, readonly number[]> = {
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/jpeg": [0xff, 0xd8, 0xff],
};

export async function validateImage(file: File): Promise<string | null> {
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_IMAGE_BYTES) return "Choose an image no larger than 10 MB.";

  const signature = signatures[file.type];
  if (!signature) return "Choose a JPEG or PNG image.";

  try {
    const bytes = new Uint8Array(await file.slice(0, signature.length).arrayBuffer());
    if (!signature.every((byte, index) => bytes[index] === byte)) {
      return "The file contents do not match its image type.";
    }
    const bitmap = await createImageBitmap(file);
    bitmap.close();
    return null;
  } catch {
    return "This image could not be read. Choose another JPEG or PNG.";
  }
}
