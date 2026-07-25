import { join, normalize } from 'path';

/**
 * Magic bytes for common image formats
 */
const IMAGE_SIGNATURES: { mime: string; ext: string; signatures: number[][] }[] = [
  {
    mime: 'image/jpeg',
    ext: 'jpg',
    signatures: [
      [0xFF, 0xD8, 0xFF, 0xDB],
      [0xFF, 0xD8, 0xFF, 0xE0],
      [0xFF, 0xD8, 0xFF, 0xE1],
      [0xFF, 0xD8, 0xFF, 0xEE],
      [0xFF, 0xD8, 0xFF, 0xE2],
      [0xFF, 0xD8, 0xFF, 0xE3],
      [0xFF, 0xD8, 0xFF, 0xE8],
    ],
  },
  {
    mime: 'image/png',
    ext: 'png',
    signatures: [
      [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    ],
  },
  {
    mime: 'image/gif',
    ext: 'gif',
    signatures: [
      [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
    ],
  },
  {
    mime: 'image/webp',
    ext: 'webp',
    signatures: [
      // RIFF....WEBP (bytes at 0-3 and 8-11)
      // We check the RIFF header
      [0x52, 0x49, 0x46, 0x46],
    ],
  },
  {
    mime: 'image/bmp',
    ext: 'bmp',
    signatures: [
      [0x42, 0x4D], // BM
    ],
  },
  {
    mime: 'image/heic',
    ext: 'heic',
    signatures: [
      // ftyp header at offset 4
      [0x00, 0x00, 0x00], // We'll check for ftyp specially
    ],
  },
];

/**
 * Result of file type detection
 */
export interface FileTypeResult {
  isValid: boolean;
  mime: string | null;
  ext: string | null;
  error?: string;
}

/**
 * Check if buffer starts with the given signature
 */
function matchesSignature(buffer: Buffer, signature: number[]): boolean {
  if (buffer.length < signature.length) return false;
  return signature.every((byte, index) => buffer[index] === byte);
}

/**
 * Detect file type from buffer content (magic bytes)
 */
export function detectImageType(buffer: Buffer): FileTypeResult {
  if (buffer.length < 12) {
    return { isValid: false, mime: null, ext: null, error: 'File too small' };
  }

  // Check for WebP specially (RIFF....WEBP)
  if (matchesSignature(buffer, [0x52, 0x49, 0x46, 0x46])) {
    // Check for WEBP at offset 8
    if (buffer.length >= 12 && 
        buffer[8] === 0x57 && buffer[9] === 0x45 && 
        buffer[10] === 0x42 && buffer[11] === 0x50) {
      return { isValid: true, mime: 'image/webp', ext: 'webp' };
    }
  }

  // Check for HEIC/HEIF (ftyp at offset 4)
  if (buffer.length >= 12) {
    const ftypCheck = buffer.slice(4, 8).toString('ascii');
    if (ftypCheck === 'ftyp') {
      const brand = buffer.slice(8, 12).toString('ascii');
      if (brand === 'heic' || brand === 'heix' || brand === 'hevc' || 
          brand === 'hevx' || brand === 'mif1' || brand === 'msf1') {
        return { isValid: true, mime: 'image/heic', ext: 'heic' };
      }
    }
  }

  // Check other formats
  for (const format of IMAGE_SIGNATURES) {
    if (format.mime === 'image/webp' || format.mime === 'image/heic') continue; // Already checked
    
    for (const signature of format.signatures) {
      if (matchesSignature(buffer, signature)) {
        return { isValid: true, mime: format.mime, ext: format.ext };
      }
    }
  }

  return { isValid: false, mime: null, ext: null, error: 'Unknown or unsupported image format' };
}

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

/**
 * Validate that a file is a safe image
 */
export function validateImageFile(
  buffer: Buffer,
  maxSizeBytes: number = 10 * 1024 * 1024 // 10MB default
): FileTypeResult {
  // Check size
  if (buffer.length > maxSizeBytes) {
    return { 
      isValid: false, 
      mime: null, 
      ext: null, 
      error: `File exceeds maximum size of ${Math.round(maxSizeBytes / 1024 / 1024)}MB` 
    };
  }

  // Detect type from content
  const detected = detectImageType(buffer);
  
  if (!detected.isValid) {
    return detected;
  }

  // Check against allowed types
  if (!ALLOWED_IMAGE_TYPES.includes(detected.mime!)) {
    return { 
      isValid: false, 
      mime: detected.mime, 
      ext: detected.ext, 
      error: `File type ${detected.mime} is not allowed` 
    };
  }

  return detected;
}

/**
 * Generate a safe filename
 * - Removes path traversal attempts
 * - Uses detected extension (not user-provided)
 * - Adds unique identifier
 */
export function generateSafeFilename(
  userId: string,
  detectedExtension: string,
  prefix: string = ''
): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  
  // Sanitize userId (remove any path characters)
  const safeUserId = userId.replace(/[^a-zA-Z0-9-]/g, '');
  
  // Sanitize extension
  const safeExt = detectedExtension.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5);
  
  // Build filename
  const parts = [prefix, safeUserId, timestamp.toString(), randomString].filter(Boolean);
  return `${parts.join('-')}.${safeExt}`;
}

/**
 * Validate that a path doesn't escape the upload directory
 */
export function validateUploadPath(uploadDir: string, filename: string): string | null {
  // Normalize paths
  const normalizedDir = normalize(uploadDir);
  const fullPath = normalize(join(uploadDir, filename));
  
  // Ensure the path starts with the upload directory
  if (!fullPath.startsWith(normalizedDir)) {
    return null; // Path traversal attempt
  }
  
  return fullPath;
}

/**
 * Sanitize a filename (for display purposes, not storage)
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.+/g, '.')
    .slice(0, 255);
}

