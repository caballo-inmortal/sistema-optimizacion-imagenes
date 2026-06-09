import { useCallback, useState } from "react";
import { ObtenerFaltantesConfiguracion } from "./config/AwsConfig.js";
import { PantallaLogin } from "./components/PantallaLogin.jsx";
import { useAuth } from "./hooks/useAuth.js";
import { useGaleriaS3 } from "./hooks/useGaleriaS3.js";
import { useMultiImageUpload } from "./hooks/useMultiImageUpload.js";
import { FormatearTamano } from "./utils/ImageValidation.js";
import "./App.css";

function EtiquetaEstado({ estado }) {
  const etiquetas = {
    listo: "Listo",
    subiendo: "Subiendo",
    exito: "En la nube",
    error: "Error",
  };

  return (
    <span className={`EstadoBadge EstadoBadge--${estado}`}>
      {etiquetas[estado] ?? estado}
    </span>
  );
}

function ObtenerUrlVisualizacion(item) {
  return item.viewUrl || item.previewUrl || "";
}

function ObtenerNombreImagen(item) {
  return item.nombre || item.archivo?.name || "Imagen";
}

function ObtenerTamanoImagen(item) {
  if (typeof item.tamano === "number") return item.tamano;
  return item.archivo?.size ?? 0;
}

function App() {
  const {
    usuario,
    cargando: cargandoAuth,
    error: errorAuth,
    setError: setErrorAuth,
    requiereNuevaContrasena,
    login,
    completarNuevaContrasena,
    logout,
  } = useAuth();

  const [galeriaAbierta, setGaleriaAbierta] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState(null);

  const galeria = useGaleriaS3();

  const {
    imagenes,
    mensaje,
    subiendo,
    pendientes,
    fallidas,
    awsConfigurado,
    procesarArchivos,
    seleccionarImagenes,
    eliminarImagen,
    subirTodas,
  } = useMultiImageUpload({
    onSubidaExitosa: galeria.registrarSubidas,
  });

  const [arrastrando, setArrastrando] = useState(false);

  const manejarDragOver = useCallback((e) => {
    e.preventDefault();
    setArrastrando(true);
  }, []);

  const manejarDragLeave = useCallback((e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setArrastrando(false);
    }
  }, []);

  const manejarDrop = useCallback(
    (e) => {
      e.preventDefault();
      setArrastrando(false);
      procesarArchivos(Array.from(e.dataTransfer.files ?? []));
    },
    [procesarArchivos]
  );

  const abrirGaleria = () => {
    if (!awsConfigurado) return;
    setGaleriaAbierta(true);
    galeria.cargarDesdeS3();
  };

  if (cargandoAuth) {
    return (
      <div className="AppCargando">
        <span className="AppCargandoIcono">☁</span>
        <p>Verificando sesión…</p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <PantallaLogin
        onLogin={login}
        onCompletarNuevaContrasena={completarNuevaContrasena}
        requiereNuevaContrasena={requiereNuevaContrasena}
        error={errorAuth}
        setError={setErrorAuth}
      />
    );
  }

  return (
    <div className="App">
      <div className="AppFondo" aria-hidden="true">
        <span className="AppOrbe AppOrbe--violeta" />
        <span className="AppOrbe AppOrbe--naranja" />
        <span className="AppOrbe AppOrbe--cyan" />
      </div>

      <header className="AppCabecera">
        <div className="AppCabeceraTop">
          <div className="AppMarca">
            <span className="AppLogo">☁</span>
            <div>
              <p className="AppMarcaEtiqueta">AWS · S3 · Lambda</p>
              <h1 className="AppTitulo">CloudPix Studio</h1>
            </div>
          </div>
          <div className="AppSesion">
            <span className="AppSesionEmail">{usuario.email}</span>
            <button
              type="button"
              className="Boton Boton--fantasma AppSesionSalir"
              onClick={logout}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
        <p className="AppSubtitulo">
          Sube, optimiza y guarda tus imágenes en la nube con un flujo rápido y
          seguro.
        </p>
      </header>

      <main className="AppPrincipal">
        <section className="Panel Panel--subida">
          <div className="PanelEncabezado">
            <h2>Zona de carga</h2>
            <p>Arrastra o selecciona JPG, PNG y WebP</p>
          </div>

          {!awsConfigurado && (
            <div className="AvisoConfig">
              Configura <code>.env</code> en la raíz del proyecto y reinicia{" "}
              <code>npm run dev</code>.
              {ObtenerFaltantesConfiguracion().length > 0 && (
                <>
                  {" "}
                  Faltan:{" "}
                  <code>{ObtenerFaltantesConfiguracion().join(", ")}</code>.
                </>
              )}
              <br />
              Guía AWS: <code>aws/GUIA-CONFIGURACION-AWS.md</code>
            </div>
          )}

          <div
            className={`ZonaArrastre${arrastrando ? " ZonaArrastre--activa" : ""}`}
            onDragOver={manejarDragOver}
            onDragEnter={manejarDragOver}
            onDragLeave={manejarDragLeave}
            onDrop={manejarDrop}
          >
            <div className="ZonaArrastreIcono">📸</div>
            <p className="ZonaArrastreTexto">
              Selecciona una o varias imágenes para subir a Amazon S3
            </p>
            <label className="Boton Boton--primario Boton--archivo">
              Elegir imágenes
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={seleccionarImagenes}
                hidden
                disabled={subiendo}
              />
            </label>
          </div>

          <div className="Estadisticas">
            <div className="Estadistica">
              <span className="EstadisticaValor">{imagenes.length}</span>
              <span className="EstadisticaEtiqueta">En cola</span>
            </div>
            <div className="Estadistica">
              <span className="EstadisticaValor EstadisticaValor--amber">
                {pendientes}
              </span>
              <span className="EstadisticaEtiqueta">Pendientes</span>
            </div>
            <div className="Estadistica">
              <span className="EstadisticaValor EstadisticaValor--verde">
                {galeria.cargando ? "…" : galeria.total}
              </span>
              <span className="EstadisticaEtiqueta">En S3</span>
            </div>
          </div>

          <div className="MensajeEstado">{mensaje}</div>

          <div className="BarraAcciones">
            <button
              type="button"
              className="Boton Boton--gradiente"
              onClick={subirTodas}
              disabled={subiendo || pendientes === 0 || !awsConfigurado}
            >
              {subiendo ? "Subiendo a la nube…" : `Subir ${pendientes} imagen(es)`}
            </button>

            <button
              type="button"
              className="Boton Boton--galeria"
              onClick={abrirGaleria}
              disabled={!awsConfigurado}
            >
              Ver imágenes en S3 ({galeria.cargando ? "…" : galeria.total})
            </button>

            {fallidas > 0 && !subiendo && (
              <button
                type="button"
                className="Boton Boton--reintentar"
                onClick={subirTodas}
              >
                Reintentar {fallidas} fallida(s)
              </button>
            )}

            {awsConfigurado && !subiendo && (
              <button
                type="button"
                className="Boton Boton--fantasma"
                onClick={galeria.cargarDesdeS3}
                disabled={galeria.cargando}
              >
                {galeria.cargando ? "Actualizando…" : "Actualizar galería"}
              </button>
            )}
          </div>
        </section>

        <section className="Panel Panel--cola">
          <div className="PanelEncabezado">
            <h2>Cola de trabajo</h2>
            <p>Estado de cada archivo</p>
          </div>

          {imagenes.length === 0 ? (
            <div className="ColaVacia">
              <span>🖼️</span>
              <p>Aún no hay imágenes en la cola</p>
            </div>
          ) : (
            <ul className="ListaCola">
              {imagenes.map((item) => (
                <li key={item.id} className="TarjetaCola">
                  <img
                    className="TarjetaColaMiniatura"
                    src={item.previewUrl}
                    alt={item.archivo.name}
                  />
                  <div className="TarjetaColaCuerpo">
                    <p className="TarjetaColaNombre" title={item.archivo.name}>
                      {item.archivo.name}
                    </p>
                    <p className="TarjetaColaMeta">
                      {FormatearTamano(item.archivo.size)}
                    </p>
                    <EtiquetaEstado estado={item.estado} />
                    {item.estado === "subiendo" && (
                      <div className="BarraProgreso">
                        <div
                          className="BarraProgresoRelleno"
                          style={{ width: `${item.progreso}%` }}
                        />
                      </div>
                    )}
                    {item.error && (
                      <p className="TarjetaColaError">{item.error}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="BotonIcono"
                    onClick={() => eliminarImagen(item.id)}
                    disabled={subiendo || item.estado === "subiendo"}
                    aria-label={`Eliminar ${item.archivo.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <div className="FlujoAws">
        <span>React</span>
        <span className="FlujoFlecha">→</span>
        <span>API Gateway</span>
        <span className="FlujoFlecha">→</span>
        <span>Lambda</span>
        <span className="FlujoFlecha">→</span>
        <span>S3</span>
      </div>

      {galeriaAbierta && (
        <section className="GaleriaOverlay" role="dialog" aria-modal="true">
          <div className="GaleriaPanel">
            <div className="GaleriaCabecera">
              <div>
                <h2>Galería en la nube</h2>
                <p>
                  {galeria.cargando
                    ? "Cargando imágenes desde S3…"
                    : `${galeria.total} imagen(es) en el bucket`}
                </p>
              </div>
              <div className="GaleriaCabeceraAcciones">
                <button
                  type="button"
                  className="Boton Boton--fantasma"
                  onClick={galeria.cargarDesdeS3}
                  disabled={galeria.cargando}
                >
                  Actualizar
                </button>
                <button
                  type="button"
                  className="Boton Boton--cerrar"
                  onClick={() => setGaleriaAbierta(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>

            {!galeria.cargando && galeria.total === 0 && (
              <div className="ColaVacia GaleriaVacia">
                <span>☁️</span>
                <p>Aún no hay imágenes para mostrar</p>
              </div>
            )}

            <div className="GaleriaGrid">
              {galeria.imagenes.map((item) => (
                <article key={item.key} className="GaleriaTarjeta">
                  <button
                    type="button"
                    className="GaleriaTarjetaImagen"
                    onClick={() => setImagenAmpliada(item)}
                  >
                    <img
                      src={ObtenerUrlVisualizacion(item)}
                      alt={ObtenerNombreImagen(item)}
                      loading="lazy"
                    />
                    <span className="GaleriaTarjetaHover">Ampliar</span>
                  </button>
                  <div className="GaleriaTarjetaInfo">
                    <p title={ObtenerNombreImagen(item)}>
                      {ObtenerNombreImagen(item)}
                    </p>
                    <small>{FormatearTamano(ObtenerTamanoImagen(item))}</small>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {imagenAmpliada && (
        <div
          className="Lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setImagenAmpliada(null)}
        >
          <div
            className="LightboxContenido"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="LightboxCerrar"
              onClick={() => setImagenAmpliada(null)}
            >
              ✕
            </button>
            <img
              src={ObtenerUrlVisualizacion(imagenAmpliada)}
              alt={ObtenerNombreImagen(imagenAmpliada)}
            />
            <div className="LightboxPie">
              <strong>{ObtenerNombreImagen(imagenAmpliada)}</strong>
              {imagenAmpliada.viewUrl && (
                <div className="LightboxAcciones">
                  <a
                    href={imagenAmpliada.viewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="LightboxEnlace"
                  >
                    Abrir en nueva pestaña
                  </a>
                  <a
                    href={imagenAmpliada.viewUrl}
                    download={ObtenerNombreImagen(imagenAmpliada)}
                    className="LightboxEnlace LightboxEnlace--descarga"
                  >
                    Descargar
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
