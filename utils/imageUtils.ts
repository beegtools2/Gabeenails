import heic2any from 'heic2any';

export async function compressImage(file: File, maxWidth = 600, quality = 0.75): Promise<string> {
  let targetFile: Blob | File = file;

  // Detectar y convertir formatos HEIC / HEIF de iOS (iPhones/iPads)
  const isHeic =
    file.type.toLowerCase().includes('heic') ||
    file.type.toLowerCase().includes('heif') ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif');

  // Detectar GIF animado para preservar sus fotogramas sin aplanar
  const isGif =
    file.type.toLowerCase().includes('gif') ||
    file.name.toLowerCase().endsWith('.gif');

  if (isGif) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => reject(new Error('Error al procesar el archivo GIF animado.'));
      reader.readAsDataURL(file);
    });
  }

  if (isHeic) {
    try {
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.75,
      });
      targetFile = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    } catch (err) {
      console.warn('Advertencia al convertir archivo HEIC con heic2any:', err);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const result = e.target?.result;
          if (typeof result === 'string' && result.startsWith('data:image')) {
            resolve(result);
          } else {
            reject(new Error('No se pudo inicializar el contexto de imagen.'));
          }
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl && dataUrl.startsWith('data:image')) {
          resolve(dataUrl);
        } else {
          reject(new Error('La imagen generada está vacía.'));
        }
      };
      img.onerror = () => {
        reject(new Error('No se pudo decodificar el archivo de imagen. Es posible que el formato no sea compatible.'));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo en el navegador.'));
    };
    reader.readAsDataURL(targetFile);
  });
}
