// Client-side image downscaler. Generates a JPEG thumbnail (default 400px wide)
// using Canvas API. Returns a Blob suitable for direct Supabase Storage upload.
export async function makeThumbnail(file, { maxWidth = 400, quality = 0.78 } = {}) {
  if (!file || !file.type?.startsWith("image/")) return null;
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);

  const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);

  return await new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality),
  );
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
