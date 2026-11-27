let model;
let Tensor;
let queue = Promise.resolve();

async function digest(bytes) {
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function prepareModel(expectedHash) {
  const runtime = await import("./runtime/litert.js");
  const response = await fetch(new URL("./malaria_thinsmear_44.tflite", self.location.href), { redirect: "error" });
  if (!response.ok) throw new Error("Model could not be loaded.");
  const bytes = await response.arrayBuffer();
  if (await digest(bytes) !== expectedHash) throw new Error("Model checksum mismatch.");
  // Emscripten otherwise resolves the Wasm binary relative to the worker script.
  self.Module = { locateFile: (filename) => new URL(`./runtime/${filename}`, self.location.href).href };
  await runtime.loadLiteRt(new URL("./runtime/litert_wasm_compat_internal.js", self.location.href).href);
  const compiled = await runtime.loadAndCompile(new Uint8Array(bytes), { accelerator: "wasm" });
  Tensor = runtime.Tensor;
  return compiled;
}

async function normalizedRgb(png) {
  const bitmap = await createImageBitmap(new Blob([png], { type: "image/png" }), {
    colorSpaceConversion: "none", premultiplyAlpha: "none",
  });
  try {
    if (bitmap.width !== 44 || bitmap.height !== 44) throw new Error("Unexpected image dimensions.");
    const canvas = new OffscreenCanvas(44, 44);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Image decoding unavailable.");
    context.drawImage(bitmap, 0, 0);
    const rgba = context.getImageData(0, 0, 44, 44).data;
    const rgb = new Float32Array(44 * 44 * 3);
    for (let pixel = 0; pixel < 44 * 44; pixel++) {
      for (let channel = 0; channel < 3; channel++) {
        rgb[pixel * 3 + channel] = rgba[pixel * 4 + channel] / 255;
      }
    }
    return rgb;
  } finally {
    bitmap.close();
  }
}

async function analyze(request) {
  const { id, png, imageSha256, modelSha256 } = request;
  try {
    if (await digest(png) !== imageSha256) throw new Error("Image checksum mismatch.");
    const pixels = await normalizedRgb(png);
    const tensorSha256 = await digest(pixels.buffer);
    model ??= await prepareModel(modelSha256);
    const input = new Tensor(pixels, [1, 44, 44, 3]);
    let outputs = [];
    try {
      outputs = await model.run(input);
      if (outputs.length !== 1) throw new Error("Unexpected model output count.");
      const scores = Array.from(await outputs[0].data());
      if (scores.length !== 2 || !scores.every(Number.isFinite)) throw new Error("Unexpected model scores.");
      self.postMessage({
        id, imageSha256, modelSha256, tensorSha256, scores,
        finding: scores[0] >= 0.5 ? "parasitized" : "uninfected",
      });
    } finally {
      input.delete();
      for (const output of outputs) output.delete();
    }
  } catch (error) {
    console.warn("LiteRT browser inference failed.", error);
    self.postMessage({ id, error: true });
  }
}

self.addEventListener("message", ({ data }) => {
  // One compiled interpreter, one invocation at a time.
  queue = queue.then(() => analyze(data));
});
