import { useCallback, useEffect, useRef, useState } from "react";
import { EstaAwsConfigurado } from "../config/AwsConfig.js";
import { SubirImagenAS3 } from "../services/S3UploadService.js";
import {
  EsImagenValida,
  EsTamanoValido,
  FormatearTamano,
  MaximoImagenes,
  TamanoMaximoBytes,
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

export function useMultiImageUpload({ onSubidaExitosa } = {}) {
  const [imagenes, setImagenes] = useState([]);
  const [mensaje, setMensaje] = useState(
    "Selecciona o arrastra imágenes (JPG, PNG o WebP, máx. 10 MB c/u)."
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
      prev.map((item) => (item.id === id ? { ...item, ...cambios } : item))
    );
  }, []);

  const procesarArchivos = useCallback((archivos) => {
    if (!archivos.length) return;

    const formatoInvalido = archivos.filter((a) => !EsImagenValida(a));
    if (formatoInvalido.length > 0) {
      setMensaje(
        `${formatoInvalido.length} archivo(s) con formato no permitido. Solo JPG, PNG o WebP.`
      );
      return;
    }

    const pesoInvalido = archivos.filter((a) => !EsTamanoValido(a));
    if (pesoInvalido.length > 0) {
      setMensaje(
        `${pesoInvalido.length} archivo(s) superan el límite de ${FormatearTamano(TamanoMaximoBytes)} por imagen.`
      );
      return;
    }

    setImagenes((prev) => {
      if (prev.length + archivos.length > MaximoImagenes) {
        setMensaje(`Máximo ${MaximoImagenes} imágenes por lote.`);
        return prev;
      }
      const nuevos = archivos.map(CrearItemImagen);
      setMensaje(
        `${prev.length + nuevos.length} imagen(es) lista(s) para subir a AWS S3.`
      );
      return [...prev, ...nuevos];
    });
  }, []);

  const seleccionarImagenes = useCallback(
    (evento) => {
      procesarArchivos(Array.from(evento.target.files ?? []));
      evento.target.value = "";
    },
    [procesarArchivos]
  );

  const eliminarImagen = useCallback((id) => {
    setImagenes((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      const restantes = prev.filter((i) => i.id !== id);
      setMensaje(
        restantes.length === 0
          ? "Selecciona o arrastra imágenes (JPG, PNG o WebP, máx. 10 MB c/u)."
          : `${restantes.length} imagen(es) en cola.`
      );
      return restantes;
    });
  }, []);

  const quitarDeCola = useCallback((idsExitosos) => {
    if (idsExitosos.size === 0) return;
    setImagenes((prev) => {
      prev
        .filter((i) => idsExitosos.has(i.id))
        .forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return prev.filter((i) => !idsExitosos.has(i.id));
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
    const idsExitosos = new Set();
    const subidasParaGaleria = [];

    for (const item of pendientes) {
      actualizarItem(item.id, { estado: "subiendo", progreso: 0, error: null });

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
        idsExitosos.add(item.id);
        subidasParaGaleria.push({
          key: resultado.key,
          viewUrl: resultado.viewUrl ?? null,
          nombre: item.archivo.name,
          tamano: item.archivo.size,
          fecha: new Date().toISOString(),
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
    quitarDeCola(idsExitosos);

    if (subidasParaGaleria.length > 0) {
      onSubidaExitosa?.(subidasParaGaleria);
    }

    if (fallidas === 0 && exitosas > 0) {
      setMensaje(`${exitosas} imagen(es) guardada(s) en S3. Cola vacía.`);
    } else if (fallidas === 0) {
      setMensaje("No hay imágenes pendientes de subir.");
    } else if (exitosas > 0) {
      setMensaje(
        `${exitosas} subida(s), ${fallidas} error(es). Las exitosas ya no están en la cola.`
      );
    } else {
      setMensaje(`${fallidas} error(es). Usa "Reintentar" para volver a intentarlo.`);
    }
  }, [imagenes, actualizarItem, quitarDeCola, onSubidaExitosa]);

  const pendientes = imagenes.filter(
    (i) => i.estado === "listo" || i.estado === "error"
  ).length;

  const fallidas = imagenes.filter((i) => i.estado === "error").length;

  return {
    imagenes,
    mensaje,
    subiendo,
    pendientes,
    fallidas,
    awsConfigurado: EstaAwsConfigurado(),
    procesarArchivos,
    seleccionarImagenes,
    eliminarImagen,
    subirTodas,
  };
}
