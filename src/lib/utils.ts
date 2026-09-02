export function toGoogleDriveDirectUrl(url: string): string {
  const idMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idMatch) {
    return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`
  }
  return url
}

export function isGoogleDriveUrl(url: string): boolean {
  return /drive\.google\.com/.test(url)
}
