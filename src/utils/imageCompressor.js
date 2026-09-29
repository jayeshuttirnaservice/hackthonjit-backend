import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';

const UPLOAD_DIR = path.resolve('uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Compresses a base64 image and saves it physically to the /uploads folder.
 * Converts to optimized WebP format with quality 80 and max width 1200px.
 * 
 * @param {string} base64String - Data URI base64 string
 * @param {string} prefix - Filename prefix (e.g. 'receipt')
 * @returns {Promise<string>} - The relative public URL path (e.g. '/uploads/receipt-xyz.webp')
 */
export async function compressAndSaveImage(base64String, prefix = 'receipt') {
  if (!base64String || typeof base64String !== 'string') {
    return '';
  }

  // If already a URL or path, return as is
  if (!base64String.startsWith('data:')) {
    return base64String;
  }

  // Extract base64 data
  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return '';
  }

  try {
    const buffer = Buffer.from(matches[2], 'base64');
    const originalSizeKb = Math.round(buffer.length / 1024);

    const uniqueId = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const filename = `${prefix}-${timestamp}-${uniqueId}.webp`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Compress using Sharp:
    // - Auto-orient according to EXIF (fixes mobile camera orientation)
    // - Resize max width 1200px (without enlargement)
    // - Convert to WebP format at 80% quality
    await sharp(buffer)
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toFile(filePath);

    const stats = fs.statSync(filePath);
    const compressedSizeKb = Math.round(stats.size / 1024);

    console.log(
      `📸 Image compressed & saved physically: ${filename} | Original: ${originalSizeKb}KB -> Compressed: ${compressedSizeKb}KB (-${Math.round(
        (1 - stats.size / buffer.length) * 100
      )}%)`
    );

    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error compressing image with sharp:', error);
    return '';
  }
}
