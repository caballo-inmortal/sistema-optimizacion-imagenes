import { useCallback, useMemo, useState } from "react";
import { EstaAwsConfigurado } from "../config/AwsConfig.js";
import { ListarImagenesDesdeS3 } from "../services/S3UploadService.js";

const CLAVE_SESION = "cloudpix-galeria-sesion";

function LeerSesion() {
  try {
    const raw = sessionStorage.getItem(CLAVE_SESION);
    if (!raw) return [];
    const datos = JSON.parse(raw);
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

function GuardarSesion(imagenes) {
  try {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(imagenes));
  } catch {
    /* quota exceeded */
  }
}

function FusionarImagenes(listas) {
  const mapa = new Map();

  for (const lista of listas) {
    for (const item of lista) {
      if (!item?.key) continue;
      mapa.set(item.key, item);
    }
  }

  return Array.from(mapa.values()).sort((a, b) => {
    const fa = new Date(a.fecha ?? 0).getTime();
    const fb = new Date(b.fecha ?? 0).getTime();
    return fb - fa;
  });
}

export function useGaleriaS3() {
  const [imagenesSesion, setImagenesSesion] = useState(LeerSesion);
  const [imagenesRemotas, setImagenesRemotas] = useState([]);
  const [cargando, setCargando] = useState(false);

  const imagenes = useMemo(
    () => FusionarImagenes([imagenesRemotas, imagenesSesion]),
    [imagenesRemotas, imagenesSesion]
  );

  const registrarSubidas = useCallback((nuevas) => {
    if (!nuevas?.length) return;

    setImagenesSesion((prev) => {
      const fusionadas = FusionarImagenes([nuevas, prev]);
      GuardarSesion(fusionadas);
      return fusionadas;
    });
  }, []);

  const cargarDesdeS3 = useCallback(async () => {
    if (!EstaAwsConfigurado()) return;

    setCargando(true);

    try {
      const resultado = await ListarImagenesDesdeS3();
      setImagenesRemotas(resultado.imagenes ?? []);
    } catch {
      /* POST /list no configurado o red: la galería usa imágenes de sesión */
    } finally {
      setCargando(false);
    }
  }, []);

  return {
    imagenes,
    cargando,
    total: imagenes.length,
    cargarDesdeS3,
    registrarSubidas,
  };
}
