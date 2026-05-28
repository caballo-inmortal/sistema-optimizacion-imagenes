import { useState } from "react";
import "./App.css";

function App() {
  const [imagen, setImagen] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [mensaje, setMensaje] = useState(
    "Selecciona una imagen para comenzar."
  );

  const seleccionarImagen = (e) => {
    const archivoSeleccionado = e.target.files[0];

    if (!archivoSeleccionado) return;

    const formatosPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!formatosPermitidos.includes(archivoSeleccionado.type)) {
      setImagen(null);
      setArchivo(null);
      setMensaje(
        "Formato no permitido. Solo se acepta JPG, PNG o WebP."
      );
      return;
    }

    setArchivo(archivoSeleccionado);
    setImagen(URL.createObjectURL(archivoSeleccionado));

    setMensaje("Imagen validada correctamente.");
  };

  return (
    <div className="contenedor">
      <div className="card">

        <h1>Sistema de Optimización de Imágenes en la Nube</h1>

        <p className="descripcion">
          Plataforma cloud para procesamiento y optimización automática
          de imágenes utilizando AWS.
        </p>

        <div className="arquitectura">
          <span>React</span>
          <span>→</span>
          <span>S3</span>
          <span>→</span>
          <span>Lambda</span>
          <span>→</span>
          <span>CloudWatch</span>
        </div>

        <div className="pasos">
          <div className="paso">1. Subida</div>
          <div className="paso">2. Validación</div>
          <div className="paso">3. Optimización</div>
          <div className="paso">4. Almacenamiento</div>
        </div>

        <label className="boton-subir">
          Seleccionar Imagen
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={seleccionarImagen}
            hidden
          />
        </label>

        {archivo && (
          <div className="info-archivo">
            <h3>Información del archivo</h3>

            <p>
              <strong>Nombre:</strong> {archivo.name}
            </p>

            <p>
              <strong>Tipo:</strong> {archivo.type}
            </p>

            <p>
              <strong>Tamaño:</strong>{" "}
              {(archivo.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        <div className="mensaje">
          {mensaje}
        </div>

        {imagen && (
          <div className="preview">
            <img src={imagen} alt="preview" />
          </div>
        )}

        <button className="boton-procesar">
          Procesar imagen en la nube
        </button>

      </div>
    </div>
  );
}

export default App;