import { AwsConfig, ObtenerListApiUrl } from "../config/AwsConfig.js";
import { ObtenerToken } from "./AuthService.js";

async function ObtenerHeaders() {
  const token = await ObtenerToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

function SubirConProgreso(url, archivo, contentType, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (evento) => {
      if (evento.lengthComputable && onProgress) {
        const porcentaje = Math.round((evento.loaded / evento.total) * 100);
        onProgress(porcentaje);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Error S3 (${xhr.status}): ${xhr.statusText}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(
        new Error(
          "Fallo la conexión al subir a S3. Revisa CORS del bucket S3 (AllowedOrigins debe incluir tu localhost, ej. http://localhost:5175)."
        )
      );
    });

    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.send(archivo);
  });
}

export async function ObtenerUrlPrefirmada(archivo) {
  const respuesta = await fetch(AwsConfig.UploadApiUrl, {
    method: "POST",
    headers: await ObtenerHeaders(),
    body: JSON.stringify({
      fileName: archivo.name,
      contentType: archivo.type,
    }),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "");
    const mensajeBase =
      detalle || `API respondió con estado ${respuesta.status}`;
    if (respuesta.status === 404) {
      throw new Error(
        `${mensajeBase}. Revisa VITE_UPLOAD_API_URL en .env (API Gateway → Stages → Invoke URL + /upload).`
      );
    }
    throw new Error(mensajeBase);
  }

  return respuesta.json();
}

export async function ListarImagenesDesdeS3() {
  const listUrl = ObtenerListApiUrl();
  if (!listUrl) {
    throw new Error("No se pudo derivar la URL /list desde VITE_UPLOAD_API_URL.");
  }

  const respuesta = await fetch(listUrl, {
    method: "POST",
    headers: await ObtenerHeaders(),
    body: JSON.stringify({}),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "");
    const mensajeBase =
      detalle || `API respondió con estado ${respuesta.status}`;
    if (respuesta.status === 404) {
      throw new Error(
        `${mensajeBase}. En API Gateway agrega la ruta POST /list apuntando a la Lambda.`
      );
    }
    throw new Error(mensajeBase);
  }

  return respuesta.json();
}

export async function SubirImagenAS3(archivo, onProgress) {
  const { uploadUrl, key, viewUrl } = await ObtenerUrlPrefirmada(archivo);

  await SubirConProgreso(uploadUrl, archivo, archivo.type, onProgress);

  return {
    key,
    viewUrl,
    bucket: AwsConfig.Bucket,
    region: AwsConfig.Region,
  };
}

