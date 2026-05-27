import { useState } from "react";
import "./App.css";

function App() {
  const [imagen, setImagen] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [mensaje, setMensaje] = useState("Selecciona una imagen para comenzar.");

  const seleccionarImagen = (e) => {
    const archivoSeleccionado = e.target.files[0];

    if (!archivoSeleccionado) return;

    const formatosPermitidos = ["image/jpeg", "image/png", "image/webp"];

    if (!formatosPermitidos.includes(archivoSeleccionado.type)) {
      setImagen(null);
      setArchivo(null);
      setMensaje("Formato no permitido. Solo se acepta JPG, PNG o WebP.");
      return;
    }

    setArchivo(archivoSeleccionado);
    setImagen(URL.createObjectURL(archivoSeleccionado));
    setMensaje("Imagen lista para subir a la nube.");
  };

  const subirImagen = () => {
    if (!archivo) {
      setMensaje("Primero selecciona una imagen.");
      return;
    }

    setMensaje("Imagen enviada correctamente. Luego conectaremos esto con AWS S3.");
  };

  return (
    <div className="container">
      <h1>Sistema de Optimización de Imágenes</h1>

      <p className="subtitulo">
        Cloud Computing con AWS S3 + Lambda
      </p>

      <div className="card">
        <input
          type="file"
          accept="image/png, image/jpeg, image/webp"
          onChange={seleccionarImagen}
        />

        <p className="mensaje">{mensaje}</p>

        {imagen && (
          <div className="preview">
            <h3>Vista previa</h3>
            <img src={imagen} alt="Vista previa" />
          </div>
        )}

        <button onClick={subirImagen}>Subir imagen a la nube</button>
      </div>
    </div>
  );
}

export default App;