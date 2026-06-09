import { useCallback, useEffect, useState } from "react";
import { EstaCognitoConfigurado } from "../config/CognitoConfig.js";
import {
  CerrarSesion,
  CompletarNuevaContrasena,
  IniciarSesion,
  ObtenerSesionActual,
} from "../services/AuthService.js";

function ExtraerEmailDeSesion(session) {
  return session?.getIdToken()?.payload?.email ?? "Usuario";
}

export function useAuth() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [requiereNuevaContrasena, setRequiereNuevaContrasena] = useState(false);
  const [cognitoUserPendiente, setCognitoUserPendiente] = useState(null);

  useEffect(() => {
    if (!EstaCognitoConfigurado()) {
      setCargando(false);
      return;
    }

    ObtenerSesionActual()
      .then((session) => {
        setUsuario(session ? { email: ExtraerEmailDeSesion(session) } : null);
      })
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
  }, []);

  const login = useCallback(async (email, contrasena) => {
    setError(null);
    try {
      const resultado = await IniciarSesion(email, contrasena);
      if (resultado.requiresNewPassword) {
        setCognitoUserPendiente(resultado.cognitoUserPendiente);
        setRequiereNuevaContrasena(true);
        return;
      }
      setUsuario({ email: ExtraerEmailDeSesion(resultado.session) });
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const completarNuevaContrasena = useCallback(async (nuevaContrasena) => {
    setError(null);
    try {
      const resultado = await CompletarNuevaContrasena(cognitoUserPendiente, nuevaContrasena);
      setRequiereNuevaContrasena(false);
      setCognitoUserPendiente(null);
      setUsuario({ email: ExtraerEmailDeSesion(resultado.session) });
    } catch (err) {
      setError(err.message);
    }
  }, [cognitoUserPendiente]);

  const logout = useCallback(() => {
    CerrarSesion();
    setUsuario(null);
    setRequiereNuevaContrasena(false);
    setCognitoUserPendiente(null);
  }, []);

  return {
    usuario,
    cargando,
    error,
    setError,
    requiereNuevaContrasena,
    login,
    completarNuevaContrasena,
    logout,
  };
}
