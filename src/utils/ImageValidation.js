export const FormatosPermitidos = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MaximoImagenes = 50;
export const TamanoMaximoBytes = 10 * 1024 * 1024; // 10 MB

export function EsImagenValida(archivo) {
  return FormatosPermitidos.includes(archivo.type);
}

export function EsTamanoValido(archivo) {
  return archivo.size <= TamanoMaximoBytes;
}

export function FormatearTamano(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
