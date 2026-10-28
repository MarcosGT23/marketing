// Detección y reparación de texto UTF-8 que fue leído como Windows-1252/Latin-1.
// Ej.: "campaÃ±a" -> "campaña", "veiculaÃ§Ã£o" -> "veiculação".

const CARACTERES_CP1252 = {
  0x80: '\u20AC',
  0x82: '\u201A',
  0x83: '\u0192',
  0x84: '\u201E',
  0x85: '\u2026',
  0x86: '\u2020',
  0x87: '\u2021',
  0x88: '\u02C6',
  0x89: '\u2030',
  0x8A: '\u0160',
  0x8B: '\u2039',
  0x8C: '\u0152',
  0x8E: '\u017D',
  0x91: '\u2018',
  0x92: '\u2019',
  0x93: '\u201C',
  0x94: '\u201D',
  0x95: '\u2022',
  0x96: '\u2013',
  0x97: '\u2014',
  0x98: '\u02DC',
  0x99: '\u2122',
  0x9A: '\u0161',
  0x9B: '\u203A',
  0x9C: '\u0153',
  0x9E: '\u017E',
  0x9F: '\u0178'
};

const BYTE_CP1252 = new Map(
  Object.entries(CARACTERES_CP1252).map(([byte, caracter]) => [caracter, Number(byte)])
);

// Patrones típicos de mojibake en cabeceras y nombres de Meta Ads.
const PATRON_MOJIBAKE = /Ã[\u0080-\u00BF\u0152-\u2122]|Â[\u00A0-\u00BF]|â€[\u0080-\u009F\u2013\u2014\u2018-\u201D\u2022\u2026]/;

export function tieneMojibake(texto = '') {
  return PATRON_MOJIBAKE.test(String(texto));
}

/**
 * Intenta reconstruir el texto original: los caracteres actuales se interpretan
 * como bytes Windows-1252 y se decodifican de nuevo como UTF-8 estricto.
 */
export function repararMojibake(texto = '') {
  const original = String(texto);
  if (!tieneMojibake(original)) return { texto: original, reparado: false };

  const bytes = new Uint8Array(original.length);
  for (let i = 0; i < original.length; i++) {
    const codigo = original.codePointAt(i);
    if (codigo <= 0xFF) {
      bytes[i] = codigo;
      continue;
    }
    const byte = BYTE_CP1252.get(original[i]);
    if (byte == null) return { texto: original, reparado: false };
    bytes[i] = byte;
  }

  try {
    const candidato = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (!tieneMojibake(candidato)) return { texto: candidato, reparado: true };
  } catch {
    // Si no es UTF-8 válido, se conserva el texto original.
  }

  return { texto: original, reparado: false };
}
