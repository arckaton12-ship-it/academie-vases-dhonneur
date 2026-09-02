const ACCENT_MAP: Record<string, string> = {
  'à': 'a', 'â': 'a', 'ä': 'a',
  'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
  'î': 'i', 'ï': 'i', 'ì': 'i',
  'ô': 'o', 'ö': 'o', 'ò': 'o',
  'ù': 'u', 'û': 'u', 'ü': 'u',
  'ç': 'c',
  'ñ': 'n',
  'À': 'A', 'Â': 'A', 'Ä': 'A',
  'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
  'Î': 'I', 'Ï': 'I', 'Ì': 'I',
  'Ô': 'O', 'Ö': 'O', 'Ò': 'O',
  'Ù': 'U', 'Û': 'U', 'Ü': 'U',
  'Ç': 'C',
  'Ñ': 'N',
  '\u2019': "'", '\u2018': "'", '\u201C': '"', '\u201D': '"',
  '\u2013': '-', '\u2014': '-',
}

const ACCENT_RE = new RegExp(`[${Object.keys(ACCENT_MAP).join('')}]`, 'g')

export function sanitizeForPdf(text: string): string {
  return text.replace(ACCENT_RE, (ch) => ACCENT_MAP[ch] ?? ch)
}
