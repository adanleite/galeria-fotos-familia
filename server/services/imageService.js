import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export const processUploadedImage = async (originalPath, filename) => {
  const uploadsDir = path.join(path.dirname(originalPath), '..');
  const photosDir = path.join(uploadsDir, 'photos');
  const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

  const ext = path.extname(filename).toLowerCase();
  const destPhotoPath = path.join(photosDir, filename);
  const destThumbPath = path.join(thumbnailsDir, filename);

  // If file is SVG, just copy it over
  if (ext === '.svg') {
    if (originalPath !== destPhotoPath) {
      fs.copyFileSync(originalPath, destPhotoPath);
    }
    fs.copyFileSync(destPhotoPath, destThumbPath);
    return {
      width: 1200,
      height: 800,
      photoUrl: `/uploads/photos/${filename}`,
      thumbUrl: `/uploads/thumbnails/${filename}`,
    };
  }

  try {
    const metadata = await sharp(originalPath).metadata();
    
    // Resize photo to max 1920 width/height for optimized storage if larger
    if (metadata.width > 1920 || metadata.height > 1920) {
      await sharp(originalPath)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .toFile(destPhotoPath);
    } else if (originalPath !== destPhotoPath) {
      fs.copyFileSync(originalPath, destPhotoPath);
    }

    // Create optimized thumbnail (400px width max)
    await sharp(destPhotoPath)
      .resize(400, 400, { fit: 'cover' })
      .toFile(destThumbPath);

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      photoUrl: `/uploads/photos/${filename}`,
      thumbUrl: `/uploads/thumbnails/${filename}`,
    };
  } catch (error) {
    console.error('Erro no processamento de imagem com sharp, fallback para cópia direta:', error);
    if (originalPath !== destPhotoPath && fs.existsSync(originalPath)) {
      fs.copyFileSync(originalPath, destPhotoPath);
      fs.copyFileSync(originalPath, destThumbPath);
    }
    return {
      width: 0,
      height: 0,
      photoUrl: `/uploads/photos/${filename}`,
      thumbUrl: `/uploads/thumbnails/${filename}`,
    };
  }
};
