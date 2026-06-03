import { useCallback, useEffect, useRef, useState } from "react";
import { EstaAwsConfigurado } from "../config/AwsConfig.js";
import { SubirImagenAS3 } from "../services/S3UploadService.js";
import {
  EsImagenValida,
  MaximoImagenes,
} from "../utils/ImageValidation.js";

function CrearItemImagen(archivo) {
  return {
    id: crypto.randomUUID(),
    archivo,
    previewUrl: URL.createObjectURL(archivo),
    estado: "listo",
    progreso: 0,
    s3Key: null,
    viewUrl: null,
    error: null,
  };
}

export function useMultiImageUpload() {
  const [imagenes, setImagenes] = useState([]);
  const [mensaje, setMensaje] = useState(
    "Selecciona una o varias imágenes (JPG, PNG o WebP)."
  );
  const [subiendo, setSubiendo] = useState(false);
  const imagenesRef = useRef([]);

  useEffect(() => {
    imagenesRef.current = imagenes;
  }, [imagenes]);

  useEffect(() => {
    return () => {
      imagenesRef.current.forEach((item) =>
        URL.revokeObjectURL(item.previewUrl)
      );
    };
  }, []);

  const actualizarItem = useCallback((id, cambios) => {
    setImagenes((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...cambios } : item
      )
    );
  }, []);

  const seleccionarImagenes = useCallback((evento) => {
    const archivos = Array.from(evento.target.files ?? []);

    if (archivos.length === 0) return;

    const invalidos = archivos.filter((a) => !EsImagenValida(a));
    if (invalidos.length > 0) {
      setMensaje(
        `${invalidos.length} archivo(s) con formato no permitido. Solo JPG, PNG o WebP.`
      );
      evento.target.value = "";
      return;
    }

    setImagenes((prev) => {
      const total = prev.length + archivos.length;
      if (total > MaximoImagenes) {
        setMensaje(`Máximo ${MaximoImagenes} imágenes por lote.`);
        return prev;
      }

      const nuevos = archivos.map(CrearItemImagen);
      setMensaje(
        `${prev.length + nuevos.length} imagen(es) lista(s) para subir a AWS S3.`
      );
      return [...prev, ...nuevos];
    });

    evento.target.value = "";
  }, []);

  const eliminarImagen = useCallback((id) => {
    setImagenes((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      const restantes = prev.filter((i) => i.id !== id);
      setMensaje(
        restantes.length === 0
          ? "Selecciona una o varias imágenes (JPG, PNG o WebP)."
          : `${restantes.length} imagen(es) en cola.`
      );
      return restantes;
    });
  }, []);

  const limpiarCompletadas = useCallback(() => {
    setImagenes((prev) => {
      prev
        .filter((i) => i.estado === "exito")
        .forEach((i) => URL.revokeObjectURL(i.previewUrl));
      const restantes = prev.filter((i) => i.estado !== "exito");
      setMensaje(
        restantes.length === 0
          ? "Selecciona una o varias imágenes (JPG, PNG o WebP)."
          : `${restantes.length} imagen(es) pendiente(s).`
      );
      return restantes;
    });
  }, []);

  const subirTodas = useCallback(async () => {
    if (!EstaAwsConfigurado()) {
      setMensaje(
        "Configura VITE_UPLOAD_API_URL y VITE_S3_BUCKET en el archivo .env"
      );
      return;
    }

    const pendientes = imagenes.filter(
      (i) => i.estado === "listo" || i.estado === "error"
    );

    if (pendientes.length === 0) {
      setMensaje("No hay imágenes pendientes de subir.");
      return;
    }

    setSubiendo(true);
    setMensaje(`Subiendo ${pendientes.length} imagen(es) a AWS S3...`);

    let exitosas = 0;
    let fallidas = 0;

    for (const item of pendientes) {
      actualizarItem(item.id, {
        estado: "subiendo",
        progreso: 0,
        error: null,
      });

      try {
        const resultado = await SubirImagenAS3(item.archivo, (progreso) => {
          actualizarItem(item.id, { progreso });
        });

        actualizarItem(item.id, {
          estado: "exito",
          progreso: 100,
          s3Key: resultado.key,
          viewUrl: resultado.viewUrl ?? null,
        });
        exitosas++;
      } catch (error) {
        actualizarItem(item.id, {
          estado: "error",
          progreso: 0,
          error: error.message ?? "Error desconocido",
        });
        fallidas++;
      }
    }

    setSubiendo(false);

    if (fallidas === 0) {
      setMensaje(
        `${exitosas} imagen(es) guardada(s) en S3 correctamente.`
      );
    } else {
      setMensaje(
        `${exitosas} subida(s), ${fallidas} error(es). Revisa cada imagen.`
      );
    }
  }, [imagenes, actualizarItem]);

  const pendientes = imagenes.filter(
    (i) => i.estado === "listo" || i.estado === "error"
  ).length;

  const completadas = imagenes.filter((i) => i.estado === "exito").length;

  return {
    imagenes,
    mensaje,
    subiendo,
    pendientes,
    completadas,
    awsConfigurado: EstaAwsConfigurado(),
    seleccionarImagenes,
    eliminarImagen,
    limpiarCompletadas,
    subirTodas,
  };
}
