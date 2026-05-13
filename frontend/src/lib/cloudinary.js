// Cloudinary upload client — proxies through the cloudinary-upload edge
// function so CLOUD_NAME / UPLOAD_PRESET stay server-side.
//
// Usage:
//   const { url, thumbnailUrl, publicId } = await uploadToCloudinary(file, (pct) => ...)
import { supabase } from './supabaseClient';

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cloudinary-upload`;

/**
 * Upload a single file to Cloudinary (via our edge proxy) with optional
 * progress callback. Returns { url, thumbnailUrl, publicId }.
 */
export async function uploadToCloudinary(file, onProgress) {
  if (!file) throw new Error('No file provided');

  const { data: { session } } = await supabase.auth.getSession();
  const token =
    session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', FN_URL);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader(
      'apikey',
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    );

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            url: data.url,
            thumbnailUrl: data.thumbnailUrl,
            publicId: data.publicId,
            width: data.width,
            height: data.height,
            bytes: data.bytes,
          });
        } else {
          reject(new Error(data.error || `Upload failed (${xhr.status})`));
        }
      } catch (err) {
        reject(new Error('Invalid server response'));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

/** Build a transformed Cloudinary URL from any Cloudinary secure URL. */
export function transformCloudinaryUrl(url, transform = 'w_400,h_400,c_fill,g_auto,q_auto,f_auto') {
  if (!url || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/${transform}/`);
}
