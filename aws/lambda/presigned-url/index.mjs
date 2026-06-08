import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};

const EXTENSIONES_IMAGEN = [".jpg", ".jpeg", ".png", ".webp"];

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

function EsRutaListado(event) {
  const routeKey = event.requestContext?.routeKey ?? "";
  const rawPath = event.rawPath ?? "";
  return routeKey.includes("/list") || rawPath === "/list";
}

function EsImagenPorClave(key) {
  const lower = key.toLowerCase();
  return EXTENSIONES_IMAGEN.some((ext) => lower.endsWith(ext));
}

function ObtenerNombreArchivo(key) {
  const segmentos = key.split("/");
  const nombre = segmentos[segmentos.length - 1] ?? key;
  const guion = nombre.indexOf("-");
  if (guion > 0 && /^\d+$/.test(nombre.slice(0, guion))) {
    return nombre.slice(guion + 1);
  }
  return nombre;
}

async function ListarImagenes(cliente, bucket, prefijo) {
  const listado = await cliente.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefijo.endsWith("/") ? prefijo : `${prefijo}/`,
    })
  );

  const objetos = (listado.Contents ?? []).filter(
    (obj) => obj.Key && EsImagenPorClave(obj.Key)
  );

  objetos.sort(
    (a, b) => new Date(b.LastModified ?? 0) - new Date(a.LastModified ?? 0)
  );

  const imagenes = await Promise.all(
    objetos.map(async (obj) => {
      const viewUrl = await getSignedUrl(
        cliente,
        new GetObjectCommand({ Bucket: bucket, Key: obj.Key }),
        { expiresIn: 3600 }
      );

      return {
        key: obj.Key,
        viewUrl,
        nombre: ObtenerNombreArchivo(obj.Key),
        tamano: obj.Size ?? 0,
        fecha: obj.LastModified?.toISOString?.() ?? null,
      };
    })
  );

  return { imagenes, total: imagenes.length };
}

async function GenerarUrlSubida(cliente, bucket, region, prefijo, fileName, contentType) {
  const key = `${prefijo}/${Date.now()}-${SanitizarNombre(fileName)}`;

  const uploadUrl = await getSignedUrl(
    cliente,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 300 }
  );

  const viewUrl = await getSignedUrl(
    cliente,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 3600 }
  );

  console.log(
    JSON.stringify({ evento: "presigned_url_generada", key, contentType, bucket })
  );

  return { uploadUrl, viewUrl, key, bucket, region };
}

export const handler = async (event) => {
  if (
    event.requestContext?.http?.method === "OPTIONS" ||
    event.httpMethod === "OPTIONS"
  ) {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  const bucket = process.env.BUCKET_NAME;
  if (!bucket) {
    return Respuesta(500, { error: "BUCKET_NAME no configurado en Lambda" });
  }

  const region = process.env.AWS_REGION ?? "us-east-2";
  const prefijo = process.env.UPLOAD_PREFIX ?? "uploads";
  const cliente = new S3Client({ region });

  if (EsRutaListado(event)) {
    try {
      const resultado = await ListarImagenes(cliente, bucket, prefijo);
      console.log(
        JSON.stringify({ evento: "listado_s3", total: resultado.total, bucket })
      );
      return Respuesta(200, resultado);
    } catch (error) {
      console.error(error);
      return Respuesta(500, {
        error: error.message ?? "Error al listar imágenes en S3",
      });
    }
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

  try {
    const resultado = await GenerarUrlSubida(
      cliente,
      bucket,
      region,
      prefijo,
      fileName,
      contentType
    );
    return Respuesta(200, resultado);
  } catch (error) {
    console.error(error);
    return Respuesta(500, {
      error: error.message ?? "Error al generar URL prefirmada",
    });
  }
};
