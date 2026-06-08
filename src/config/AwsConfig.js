const ValoresPorDefecto = {
  Region: "us-east-2",
  Bucket: "cloudpix-fredy-2026-866017706103-us-east-2-an",
};

export const AwsConfig = {
  Region: import.meta.env.VITE_AWS_REGION ?? ValoresPorDefecto.Region,
  Bucket: import.meta.env.VITE_S3_BUCKET ?? ValoresPorDefecto.Bucket,
  UploadApiUrl: import.meta.env.VITE_UPLOAD_API_URL ?? "",
};

export function ObtenerListApiUrl() {
  if (!AwsConfig.UploadApiUrl) return "";
  return AwsConfig.UploadApiUrl.replace(/\/upload\/?$/i, "/list");
}

export function EstaAwsConfigurado() {
  return Boolean(AwsConfig.UploadApiUrl && AwsConfig.Bucket);
}

export function ObtenerFaltantesConfiguracion() {
  const faltantes = [];
  if (!AwsConfig.UploadApiUrl) faltantes.push("VITE_UPLOAD_API_URL");
  if (!AwsConfig.Bucket) faltantes.push("VITE_S3_BUCKET");
  return faltantes;
}
