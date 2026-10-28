// Lectura de archivos CSV de Meta Ads con detección de codificación.
import { repararMojibake } from './mojibake.js';

const BOM_UTF8 = [0xEF, 0xBB, 0xBF];

export async function leerArchivoCsv(file) {
  const buffer = await file.arrayBuffer();
  return decodificarCsv(buffer);
}

/**
 * Decodifica un buffer eligiendo la codificación real del archivo:
 * BOM UTF-8/UTF-16, UTF-8 estricto y, si falla, Windows-1252.
 */
export function decodificarCsv(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let encoding = 'UTF-8';
  let texto = '';

  if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
    encoding = 'UTF-16 LE';
    texto = new TextDecoder('utf-16le').decode(bytes.subarray(2));
  } else if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
    encoding = 'UTF-16 BE';
    texto = decodificarUtf16Be(bytes.subarray(2));
  } else {
    const utf16SinBom = detectarUtf16SinBom(bytes);
    if (utf16SinBom) {
      encoding = utf16SinBom === 'le' ? 'UTF-16 LE' : 'UTF-16 BE';
      texto = utf16SinBom === 'le'
        ? new TextDecoder('utf-16le').decode(bytes)
        : decodificarUtf16Be(bytes);
    } else {
      if (tieneBomUtf8(bytes)) encoding = 'UTF-8 con BOM';
      try {
        texto = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      } catch {
        encoding = 'Windows-1252';
        texto = decodificarWindows1252(bytes);
      }
    }
  }

  texto = texto.replace(/^\uFEFF/, '');
  const { texto: textoReparado, reparado } = repararMojibake(texto);

  return {
    texto: textoReparado,
    encoding,
    reparado,
    etiquetaEncoding: reparado ? `${encoding} (reparado)` : encoding
  };
}

function tieneBomUtf8(bytes) {
  return bytes.length >= 3
    && bytes[0] === BOM_UTF8[0]
    && bytes[1] === BOM_UTF8[1]
    && bytes[2] === BOM_UTF8[2];
}

// Heurística para UTF-16 sin BOM: muchos bytes nulos en posiciones pares o impares.
function detectarUtf16SinBom(bytes) {
  const limite = Math.min(bytes.length, 200);
  if (limite < 4) return null;

  let nulosPares = 0;
  let nulosImpares = 0;
  for (let i = 0; i + 1 < limite; i += 2) {
    if (bytes[i] === 0) nulosPares++;
    if (bytes[i + 1] === 0) nulosImpares++;
  }

  const umbral = limite / 4;
  if (nulosImpares > umbral && nulosImpares > nulosPares) return 'le';
  if (nulosPares > umbral && nulosPares > nulosImpares) return 'be';
  return null;
}

function decodificarUtf16Be(bytes) {
  try {
    return new TextDecoder('utf-16be').decode(bytes);
  } catch {
    const intercambiado = new Uint8Array(bytes.length);
    for (let i = 0; i + 1 < bytes.length; i += 2) {
      intercambiado[i] = bytes[i + 1];
      intercambiado[i + 1] = bytes[i];
    }
    return new TextDecoder('utf-16le').decode(intercambiado);
  }
}

function decodificarWindows1252(bytes) {
  try {
    return new TextDecoder('windows-1252').decode(bytes);
  } catch {
    let texto = '';
    for (let i = 0; i < bytes.length; i++) texto += String.fromCharCode(bytes[i]);
    return texto;
  }
}
