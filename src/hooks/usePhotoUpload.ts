import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabase';

interface UploadOptions {
  files: { file: File; preview: string }[];
  folderName: string;
  isPublic: boolean;
  albumId?: string | null;
  cardId?: string | null;
  description?: string;
}

export function usePhotoUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });

  const applyWatermark = (file: File | Blob): Promise<Blob> => {
    return new Promise(resolve => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const fontSize = Math.floor(img.width * 0.15);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((-45 * Math.PI) / 180);
        ctx.fillText('ELEPHOTO', 0, 0);
        canvas.toBlob(
          blob => {
            if (blob) resolve(blob);
          },
          'image/jpeg',
          0.85
        );
      };
    });
  };

  const getImageDimensions = (
    file: File
  ): Promise<{ width: number; height: number }> => {
    return new Promise(resolve => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
    });
  };

  const uploadPhotos = async ({
    files,
    folderName,
    isPublic,
    albumId = null,
    cardId = null,
    description = '',
  }: UploadOptions) => {
    if (files.length === 0) return;
    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    try {
      const uploadedPhotos = [];

      for (let i = 0; i < files.length; i++) {
        setUploadProgress({ current: i + 1, total: files.length });

        const file = files[i].file;
        const dimensions = await getImageDimensions(file);
        const resolutionString = `${dimensions.width} x ${dimensions.height} px`;
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const timestamp = Date.now();

        const compressedFile = await imageCompression(file, {
          maxSizeMB: 0.6,
          maxWidthOrHeight: 1080,
          useWebWorker: true,
        });

        const watermarkedBlob = await applyWatermark(compressedFile);
        const watermarkedFile = new File(
          [watermarkedBlob],
          `wm_${safeFileName}`,
          { type: 'image/jpeg' }
        );

        const fileNameOriginal = `${folderName}/original_${timestamp}_${i}_${safeFileName}`;
        const fileNamePublic = `${folderName}/display_${timestamp}_${i}.jpg`;

        await Promise.all([
          supabase.storage.from('photos').upload(fileNameOriginal, file),
          supabase.storage
            .from('photos')
            .upload(fileNamePublic, watermarkedFile),
        ]);

        const {
          data: { publicUrl: thumbUrl },
        } = supabase.storage.from('photos').getPublicUrl(fileNamePublic);
        const {
          data: { publicUrl: origUrl },
        } = supabase.storage.from('photos').getPublicUrl(fileNameOriginal);

        uploadedPhotos.push({
          url: origUrl,
          thumbnail_url: thumbUrl,
          price: 15.0,
          filename: fileNameOriginal,
          is_public: isPublic,
          description: description.trim() !== '' ? description.trim() : null,
          resolution: resolutionString,
          public_album_id: albumId,
          card_id: cardId,
        });
      }

      const { error: photosError } = await supabase
        .from('photos')
        .insert(uploadedPhotos);
      if (photosError) throw photosError;

      return { success: true };
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  return { uploadPhotos, isUploading, uploadProgress };
}
