import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};

function Respuesta(statusCode, body) {
  return {
    statusCode,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function SanitizarNombre(nombre) {
  return nombre.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

export const handler = async (event) => {
  if (event.requestContext?.http?.method === "OPTIONS" || event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  const bucket = process.env.BUCKET_NAME;
  if (!bucket) {
    return Respuesta(500, { error: "BUCKET_NAME no configurado en Lambda" });
  }

  let cuerpo;
  try {
    cuerpo = JSON.parse(event.body ?? "{}");
  } catch {
    return Respuesta(400, { error: "JSON inválido" });
  }

  const { fileName, contentType } = cuerpo;

  if (!fileName || !contentType) {
    return Respuesta(400, { error: "fileName y contentType son obligatorios" });
  }

  const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
  if (!tiposPermitidos.includes(contentType)) {
    return Respuesta(400, { error: "Tipo de imagen no permitido" });
  }

  const region = process.env.AWS_REGION ?? "us-east-1";
  const prefijo = process.env.UPLOAD_PREFIX ?? "uploads";
  const key = `${prefijo}/${Date.now()}-${SanitizarNombre(fileName)}`;

  const cliente = new S3Client({ region });
  const comando = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(cliente, comando, { expiresIn: 300 });

  const viewUrl = await getSignedUrl(
    cliente,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 3600 }
  );

  console.log(JSON.stringify({
    evento: "presigned_url_generada",
    key,
    contentType,
    bucket,
  }));

  return Respuesta(200, { uploadUrl, viewUrl, key, bucket, region });
};
