type MimeGuess = { mime: string; ext: string }

const MAGIC_BYTES: [number[], string, string][] = [
  [[0x25, 0x50, 0x44, 0x46], 'application/pdf', 'pdf'],
  [[0x89, 0x50, 0x4e, 0x47], 'image/png', 'png'],
  [[0xff, 0xd8, 0xff], 'image/jpeg', 'jpg'],
  [[0x47, 0x49, 0x46], 'image/gif', 'gif'],
  [[0x52, 0x49, 0x46, 0x46], 'image/webp', 'webp'],
  [[0x4f, 0x67, 0x67, 0x53], 'video/ogg', 'ogg'],
  [[0x1a, 0x45, 0xdf, 0xa3], 'video/webm', 'webm'],
  [[0x66, 0x74, 0x79, 0x70], 'video/mp4', 'mp4'],
  [[0x49, 0x44, 0x33], 'audio/mpeg', 'mp3'],
  [[0x66, 0x4c, 0x61, 0x43], 'audio/flac', 'flac'],
  [[0x4f, 0x67, 0x67], 'audio/ogg', 'ogg'],
]

export async function sniffMime(file: File): Promise<MimeGuess | null> {
  const buf = await file.slice(0, 12).arrayBuffer()
  const bytes = new Uint8Array(buf)
  for (const [magic, mime, ext] of MAGIC_BYTES) {
    if (magic.every((b, i) => bytes[i] === b)) return { mime, ext }
  }
  return null
}

export function isCourseMediaFile(file: File): boolean {
  const allowed = ['audio/mpeg', 'audio/mp3', 'video/mp4', 'video/webm', 'video/ogg', 'application/pdf']
  return allowed.includes(file.type)
}

export function isAssignmentFile(file: File): boolean {
  const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp']
  return allowed.includes(file.type)
}

export function isNoteImageFile(file: File): boolean {
  const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf']
  return allowed.includes(file.type)
}

export function isAvatarFile(file: File): boolean {
  return ['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type) && file.size <= 5 * 1024 * 1024
}
