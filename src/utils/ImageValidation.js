export const FormatosPermitidos = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MaximoImagenes = 50;

export function EsImagenValida(archivo) {
  return FormatosPermitidos.includes(archivo.type);
}

export function FormatearTamano(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
