import { useState } from "react";
import { EstaCognitoConfigurado } from "../config/CognitoConfig.js";
import "./PantallaLogin.css";

function FormularioLogin({ onLogin, error, setError }) {
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [enviando, setEnviando] = useState(false);
  const cognitoConfigurado = EstaCognitoConfigurado();

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (!email || !contrasena) {
      setError("Completa todos los campos.");
      return;
    }
    setEnviando(true);
    try {
      await onLogin(email, contrasena);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <p className="LoginSubtitulo">Inicia sesión para continuar</p>

      {!cognitoConfigurado && (
        <div className="LoginAviso">
          Configura <code>VITE_COGNITO_USER_POOL_ID</code> y{" "}
          <code>VITE_COGNITO_CLIENT_ID</code> en tu <code>.env</code>.
        </div>
      )}

      <form className="LoginForm" onSubmit={manejarSubmit} noValidate>
        <div className="LoginCampo">
          <label className="LoginEtiqueta" htmlFor="login-email">
            Correo electrónico
          </label>
          <input
            id="login-email"
            className="LoginInput"
            type="email"
            autoComplete="email"
            placeholder="usuario@ejemplo.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            disabled={enviando || !cognitoConfigurado}
          />
        </div>

        <div className="LoginCampo">
          <label className="LoginEtiqueta" htmlFor="login-contrasena">
            Contraseña
          </label>
          <input
            id="login-contrasena"
            className="LoginInput"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={contrasena}
            onChange={(e) => { setContrasena(e.target.value); setError(null); }}
            disabled={enviando || !cognitoConfigurado}
          />
        </div>

        {error && <p className="LoginError" role="alert">{error}</p>}

        <button
          type="submit"
          className="LoginBoton"
          disabled={enviando || !cognitoConfigurado}
        >
          {enviando ? "Verificando…" : "Iniciar sesión"}
        </button>
      </form>
    </>
  );
}

function FormularioCambioContrasena({ onCompletar, error, setError }) {
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [enviando, setEnviando] = useState(false);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (!nuevaContrasena || !confirmar) {
      setError("Completa todos los campos.");
      return;
    }
    if (nuevaContrasena !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (nuevaContrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setEnviando(true);
    try {
      await onCompletar(nuevaContrasena);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <div className="LoginAviso LoginAviso--info">
        Es tu primer acceso. Elige una contraseña permanente para continuar.
      </div>

      <form className="LoginForm" onSubmit={manejarSubmit} noValidate>
        <div className="LoginCampo">
          <label className="LoginEtiqueta" htmlFor="nueva-contrasena">
            Nueva contraseña
          </label>
          <input
            id="nueva-contrasena"
            className="LoginInput"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            value={nuevaContrasena}
            onChange={(e) => { setNuevaContrasena(e.target.value); setError(null); }}
            disabled={enviando}
          />
        </div>

        <div className="LoginCampo">
          <label className="LoginEtiqueta" htmlFor="confirmar-contrasena">
            Confirmar contraseña
          </label>
          <input
            id="confirmar-contrasena"
            className="LoginInput"
            type="password"
            autoComplete="new-password"
            placeholder="Repite la contraseña"
            value={confirmar}
            onChange={(e) => { setConfirmar(e.target.value); setError(null); }}
            disabled={enviando}
          />
        </div>

        {error && <p className="LoginError" role="alert">{error}</p>}

        <button type="submit" className="LoginBoton" disabled={enviando}>
          {enviando ? "Guardando…" : "Establecer contraseña"}
        </button>
      </form>
    </>
  );
}

export function PantallaLogin({
  onLogin,
  onCompletarNuevaContrasena,
  requiereNuevaContrasena,
  error,
  setError,
}) {
  return (
    <div className="Login">
      <div className="LoginFondo" aria-hidden="true">
        <span className="LoginOrbe LoginOrbe--violeta" />
        <span className="LoginOrbe LoginOrbe--naranja" />
        <span className="LoginOrbe LoginOrbe--cyan" />
      </div>

      <div className="LoginPanel">
        <div className="LoginMarca">
          <span className="LoginLogo">☁</span>
          <div>
            <p className="LoginMarcaEtiqueta">AWS · S3 · Lambda</p>
            <h1 className="LoginTitulo">CloudPix Studio</h1>
          </div>
        </div>

        {requiereNuevaContrasena ? (
          <FormularioCambioContrasena
            onCompletar={onCompletarNuevaContrasena}
            error={error}
            setError={setError}
          />
        ) : (
          <FormularioLogin
            onLogin={onLogin}
            error={error}
            setError={setError}
          />
        )}

        <p className="LoginPie">
          Los accesos se gestionan desde <strong>AWS Cognito</strong>.
        </p>
      </div>
    </div>
  );
}
