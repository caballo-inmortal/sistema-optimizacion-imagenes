export const AwsConfig = {
  Region: import.meta.env.VITE_AWS_REGION ?? "us-east-1",
  Bucket: import.meta.env.VITE_S3_BUCKET ?? "",
  UploadApiUrl: import.meta.env.VITE_UPLOAD_API_URL ?? "",
};

export function EstaAwsConfigurado() {
  return Boolean(AwsConfig.UploadApiUrl && AwsConfig.Bucket);
}
