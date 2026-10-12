// Media Upload Engine - Veysi Pro
// Supports Catbox, Litterbox, ImgBB, TmpFiles, Custom Upload APIs, with Local Fallback

const STORAGE_KEY_UPLOAD_URL = 'veysi_upload_api_url';
export const DEFAULT_UPLOAD_URL = 'https://catbox.moe/user/api.php';

export const UPLOAD_PRESETS = [
  {
    id: 'catbox',
    name: '🐱 كاتبكس (Catbox) - يدعم صور وفيديوهات حتى 200MB',
    url: 'https://catbox.moe/user/api.php',
    supported: 'صور وفيديوهات',
  },
  {
    id: 'litterbox',
    name: '⚡ ليتربوكس (Litterbox) - رفع فوري ومباشر',
    url: 'https://litterbox.catbox.moe/resources/internals/api.php',
    supported: 'صور وفيديوهات',
  },
  {
    id: 'tmpfiles',
    name: '📁 تي ام بي فايلز (TmpFiles) - استضافة وسائط سريعة',
    url: 'https://tmpfiles.org/api/v1/upload',
    supported: 'جميع الوسائط',
  },
  {
    id: 'local',
    name: '💾 تخزين محلي مباشر (Base64) - بدون سيرفر خارجي',
    url: '',
    supported: 'صور وفيديوهات',
  }
];

export function getUploadApiUrl(): string {
  const saved = localStorage.getItem(STORAGE_KEY_UPLOAD_URL);
  if (saved !== null) {
    return saved.trim();
  }
  return DEFAULT_UPLOAD_URL;
}

export function saveUploadApiUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY_UPLOAD_URL, url.trim());
}

/**
 * Uploads an image or video file to the configured remote endpoint.
 * Automatically handles Catbox, Litterbox, ImgBB, standard multipart APIs, and falls back to Base64.
 */
export async function uploadMedia(file: File, onProgress?: (msg: string) => void): Promise<string> {
  const customUrl = getUploadApiUrl();

  if (customUrl) {
    if (onProgress) onProgress('جاري رفع الوسائط إلى مركز الرفع...');
    try {
      const formData = new FormData();

      // Compatibility with Catbox & Litterbox
      formData.append('reqtype', 'fileupload');
      formData.append('fileToUpload', file);
      if (customUrl.includes('litterbox')) {
        formData.append('time', '72h');
      }

      // Compatibility with general PHP / ImgBB / Freeimage / standard backends
      formData.append('file', file);
      formData.append('image', file);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

      const res = await fetch(customUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        const trimmed = text.trim();

        // 1. Direct plain text URL (e.g. Catbox returns "https://files.catbox.moe/xxxx.mp4")
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          if (onProgress) onProgress('تم الرفع بنجاح!');
          return trimmed;
        }

        // 2. JSON response (e.g. ImgBB, TmpFiles, Cloudinary, custom APIs)
        try {
          const json = JSON.parse(text);
          let uploadedUrl = json.url || json.data?.url || json.link || json.secure_url || json.file_url;
          
          // Tmpfiles format: { data: { url: "https://tmpfiles.org/12345/image.png" } }
          if (uploadedUrl && uploadedUrl.includes('tmpfiles.org/') && !uploadedUrl.includes('tmpfiles.org/dl/')) {
            uploadedUrl = uploadedUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
          }

          if (uploadedUrl) {
            if (onProgress) onProgress('تم الرفع بنجاح!');
            return uploadedUrl;
          }
        } catch {
          // not JSON
        }
      }
    } catch (err) {
      console.warn('Upload API request error, falling back to local storage:', err);
    }
  }

  // Fallback: Read as Base64 Data URL (guarantees media is NEVER lost)
  if (onProgress) onProgress('جاري تحضير الملف محلياً...');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (onProgress) onProgress('جاهز!');
      resolve(e.target?.result as string);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
