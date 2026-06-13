export const ALLOWED_EXTENSIONS = ['txt', 'md', 'pdf', 'docx'] as const;
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function getExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

export function isAllowedExtension(ext: string): ext is AllowedExtension {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
}

/**
 * Extracts plain text from an uploaded file buffer based on its extension.
 * PDF and DOCX parsers are dynamically imported so that the build never
 * fails if a parser package is unavailable in a given environment - the
 * route returns a clear, user-facing error instead.
 */
export async function extractText(buffer: Buffer, ext: AllowedExtension): Promise<{ text: string; error?: string }> {
  try {
    if (ext === 'txt' || ext === 'md') {
      return { text: buffer.toString('utf-8') };
    }

    if (ext === 'pdf') {
      try {
        // Import the inner module directly to avoid pdf-parse's debug entrypoint,
        // which attempts to read a bundled test PDF on require() in some setups.
        const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default as any;
        const data = await pdfParse(buffer);
        return { text: data.text || '' };
      } catch (err) {
        console.error('[extractText] pdf-parse failed', err);
        return { text: '', error: 'Could not extract text from this PDF. It may be scanned/image-based or corrupted.' };
      }
    }

    if (ext === 'docx') {
      try {
        const mammoth = (await import('mammoth')).default as any;
        const result = await mammoth.extractRawText({ buffer });
        return { text: result.value || '' };
      } catch (err) {
        console.error('[extractText] mammoth failed', err);
        return { text: '', error: 'Could not extract text from this Word document. It may be corrupted or password-protected.' };
      }
    }

    return { text: '', error: `Unsupported file type: .${ext}` };
  } catch (err) {
    console.error('[extractText] unexpected error', err);
    return { text: '', error: 'An unexpected error occurred while extracting text from this file.' };
  }
}
