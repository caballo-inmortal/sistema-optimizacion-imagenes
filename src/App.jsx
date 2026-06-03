import { useMemo, useState } from "react";
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
  return item.viewUrl || item.previewUrl;
}

function App() {
  const {
    imagenes,
    mensaje,
    subiendo,
    pendientes,
    completadas,
    awsConfigurado,
    seleccionarImagenes,
    eliminarImagen,
    limpiarCompletadas,
    subirTodas,
  } = useMultiImageUpload();

  const [galeriaAbierta, setGaleriaAbierta] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState(null);

  const imagenesSubidas = useMemo(
    () => imagenes.filter((i) => i.estado === "exito"),
    [imagenes]
  );

  const abrirGaleria = () => {
    if (completadas === 0) return;
    setGaleriaAbierta(true);
  };

  return (
    <div className="App">
      <div className="AppFondo" aria-hidden="true">
        <span className="AppOrbe AppOrbe--violeta" />
        <span className="AppOrbe AppOrbe--naranja" />
        <span className="AppOrbe AppOrbe--cyan" />
      </div>

      <header className="AppCabecera">
        <div className="AppMarca">
          <span className="AppLogo">☁</span>
          <div>
            <p className="AppMarcaEtiqueta">AWS · S3 · Lambda</p>
            <h1 className="AppTitulo">CloudPix Studio</h1>
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
              Configura <code>.env</code> con la URL de API Gateway y el bucket
              S3.
            </div>
          )}

          <div className="ZonaArrastre">
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
                {completadas}
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
              disabled={completadas === 0}
            >
              Ver imágenes subidas ({completadas})
            </button>

            {completadas > 0 && !subiendo && (
              <button
                type="button"
                className="Boton Boton--fantasma"
                onClick={limpiarCompletadas}
              >
                Limpiar subidas
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
                <p>{imagenesSubidas.length} imagen(es) guardadas en S3</p>
              </div>
              <button
                type="button"
                className="Boton Boton--cerrar"
                onClick={() => setGaleriaAbierta(false)}
              >
                Cerrar
              </button>
            </div>

            <div className="GaleriaGrid">
              {imagenesSubidas.map((item) => (
                <article key={item.id} className="GaleriaTarjeta">
                  <button
                    type="button"
                    className="GaleriaTarjetaImagen"
                    onClick={() => setImagenAmpliada(item)}
                  >
                    <img
                      src={ObtenerUrlVisualizacion(item)}
                      alt={item.archivo.name}
                      onError={(e) => {
                        e.currentTarget.src = item.previewUrl;
                      }}
                    />
                    <span className="GaleriaTarjetaHover">Ampliar</span>
                  </button>
                  <div className="GaleriaTarjetaInfo">
                    <p title={item.archivo.name}>{item.archivo.name}</p>
                    <small>{FormatearTamano(item.archivo.size)}</small>
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
              alt={imagenAmpliada.archivo.name}
              onError={(e) => {
                e.currentTarget.src = imagenAmpliada.previewUrl;
              }}
            />
            <div className="LightboxPie">
              <strong>{imagenAmpliada.archivo.name}</strong>
              {imagenAmpliada.viewUrl && (
                <a
                  href={imagenAmpliada.viewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="LightboxEnlace"
                >
                  Abrir en nueva pestaña
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
