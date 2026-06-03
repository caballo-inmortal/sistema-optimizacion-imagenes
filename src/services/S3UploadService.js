import { AwsConfig } from "../config/AwsConfig.js";

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
      reject(new Error("Fallo la conexión al subir a S3."));
    });

    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.send(archivo);
  });
}

export async function ObtenerUrlPrefirmada(archivo) {
  const respuesta = await fetch(AwsConfig.UploadApiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: archivo.name,
      contentType: archivo.type,
    }),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "");
    throw new Error(
      detalle || `API respondió con estado ${respuesta.status}`
    );
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

export async function SubirImagenesAS3(archivos, onProgresoItem) {
  const resultados = [];

  for (let indice = 0; indice < archivos.length; indice++) {
    const archivo = archivos[indice];

    const resultado = await SubirImagenAS3(archivo, (progreso) => {
      onProgresoItem?.(indice, progreso);
    });

    resultados.push({ archivo, ...resultado });
  }

  return resultados;
}
