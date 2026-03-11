export async function resizeImage(base64Str: string, maxWidth = 600, maxHeight = 600): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      
      const resizedBase64 = canvas.toDataURL('image/jpeg', 0.6);
      resolve({
        base64: resizedBase64,
        mimeType: 'image/jpeg'
      });
    };
    img.onerror = (e) => reject(e);
  });
}
