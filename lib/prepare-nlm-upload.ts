const side = 44;
const maxBytes = 32 * 1024;
const pngMagic = [137, 80, 78, 71, 13, 10, 26, 10];
type ImageType = "image/png" | "image/jpeg";

function unsupported(): never {
  throw new Error("Select a 44 x 44 RGB PNG or baseline JPEG without image metadata.");
}

function checkPng(bytes: Uint8Array, view: DataView) {
  // Allow only the chunks required for an opaque, non-interlaced RGB image.
  for (let offset = 8, data = false; offset + 12 <= bytes.length;) {
    const length = view.getUint32(offset);
    const end = offset + length + 12;
    if (end > bytes.length) unsupported();
    const kind = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (offset === 8) {
      if (kind !== "IHDR" || length !== 13 || view.getUint32(16) !== side || view.getUint32(20) !== side
        || bytes[24] !== 8 || bytes[25] !== 2 || bytes[26] || bytes[27] || bytes[28]) unsupported();
    } else if (kind === "IDAT") {
      data ||= length > 0;
    } else if (kind === "IEND" && length === 0 && data && end === bytes.length) {
      return;
    } else {
      unsupported();
    }
    offset = end;
  }
  unsupported();
}

function checkJpeg(bytes: Uint8Array, view: DataView) {
  let frame = false;
  for (let offset = 2; offset + 4 <= bytes.length;) {
    if (bytes[offset++] !== 0xff) unsupported();
    const marker = bytes[offset++];
    const length = view.getUint16(offset);
    const data = offset + 2;
    const end = offset + length;
    if (length < 2 || end > bytes.length) unsupported();
    if (marker === 0xc0) {
      if (frame || length !== 17 || bytes[data] !== 8 || view.getUint16(data + 1) !== side
        || view.getUint16(data + 3) !== side || bytes[data + 5] !== 3) unsupported();
      frame = true;
    } else if (marker === 0xda) {
      // A single interleaved baseline scan. Ignore stuffed bytes and restart markers.
      if (!frame || length !== 12 || bytes[data] !== 3
        || bytes[end - 3] !== 0 || bytes[end - 2] !== 63 || bytes[end - 1] !== 0) unsupported();
      for (let pos = end; pos < bytes.length - 1; pos++) {
        if (bytes[pos] !== 0xff) continue;
        while (bytes[pos + 1] === 0xff) pos++;
        const next = bytes[++pos];
        if (next === 0xd9 && pos === bytes.length - 1) return;
        if (next !== 0 && !(next >= 0xd0 && next <= 0xd7)) unsupported();
      }
      unsupported();
    } else if (marker === 0xe0) {
      // JFIF header only, with no embedded thumbnail.
      if (length !== 16 || String.fromCharCode(...bytes.subarray(data, data + 5)) !== "JFIF\0"
        || bytes[data + 12] || bytes[data + 13]) unsupported();
    } else if (marker !== 0xdb && marker !== 0xc4 && marker !== 0xdd) {
      unsupported();
    }
    offset = end;
  }
  unsupported();
}

function inspectContainer(buffer: ArrayBuffer): ImageType {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  if (pngMagic.every((byte, index) => bytes[index] === byte)) {
    checkPng(bytes, view);
    return "image/png";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    checkJpeg(bytes, view);
    return "image/jpeg";
  }
  return unsupported();
}

function hasPreparedMask(rgba: Uint8ClampedArray) {
  const size = side * side;
  const foreground = new Uint8Array(size);
  let count = 0;
  const corners = [0, 0, 0, 0];
  for (let i = 0; i < size; i++) {
    const offset = 4 * i;
    if (rgba[offset + 3] !== 255) return false;
    // A near-black cut-off permits small baseline JPEG ringing in the mask.
    if (Math.max(rgba[offset], rgba[offset + 1], rgba[offset + 2]) <= 24) continue;
    foreground[i] = 1;
    count++;
    const x = i % side;
    const y = Math.floor(i / side);
    if ((x < 4 || x >= side - 4) && (y < 4 || y >= side - 4)) {
      corners[Number(x >= side - 4) + 2 * Number(y >= side - 4)]++;
    }
  }
  const center = side / 2 * (side + 1);
  if (count < size * .60 || count > size * .92 || corners.some((n) => n > 4) || !foreground[center]) return false;
  const pending = [center];
  foreground[center] = 0;
  for (let i = 0; i < pending.length; i++) {
    const x = pending[i] % side;
    const y = Math.floor(pending[i] / side);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (x + dx < 0 || x + dx >= side || y + dy < 0 || y + dy >= side) continue;
        const index = (y + dy) * side + x + dx;
        if (!foreground[index]) continue;
        foreground[index] = 0;
        pending.push(index);
      }
    }
  }
  return count - pending.length <= 12;
}

export async function prepareNlmUpload(file: File) {
  if (file.size === 0 || file.size > maxBytes) throw new Error("Select a non-empty image of 32 KiB or less.");
  const original = await file.arrayBuffer();
  const type = inspectContainer(original);
  if (file.type && file.type !== type) throw new Error("The file type does not match the image contents.");
  const canvas = new OffscreenCanvas(side, side);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(new Blob([original], { type }), {
      colorSpaceConversion: "none", premultiplyAlpha: "none",
    });
  } catch {
    throw new Error("The browser could not decode this image.");
  }
  try {
    if (bitmap.width !== side || bitmap.height !== side) unsupported();
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Image decoding is unavailable in this browser.");
    ctx.drawImage(bitmap, 0, 0);
    if (!hasPreparedMask(ctx.getImageData(0, 0, side, side).data)) {
      throw new Error("The crop does not fit the expected centered, black-masked footprint.");
    }
  } finally {
    bitmap.close();
  }
  // The pinned sample worker already accepts PNG. Preserve original PNG bytes;
  // wrap decoded JPEG pixels in PNG without resampling or changing the mask.
  const png = type === "image/png" ? new Blob([original], { type }) : await canvas.convertToBlob({ type: "image/png" });
  const bytes = type === "image/png" ? original : await png.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const imageSha256 = Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return { png, bytes, imageSha256 };
}
