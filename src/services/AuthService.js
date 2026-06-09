import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from "amazon-cognito-identity-js";
import { CognitoConfig } from "../config/CognitoConfig.js";

function ObtenerPool() {
  return new CognitoUserPool({
    UserPoolId: CognitoConfig.UserPoolId,
    ClientId: CognitoConfig.ClientId,
  });
}

export function IniciarSesion(email, contrasena) {
  return new Promise((resolve, reject) => {
    const pool = ObtenerPool();
    const cognitoUser = new CognitoUser({ Username: email, Pool: pool });
    const detalles = new AuthenticationDetails({
      Username: email,
      Password: contrasena,
    });

    cognitoUser.authenticateUser(detalles, {
      onSuccess: (session) => resolve({ session }),
      onFailure: (err) => {
        const mensajes = {
          NotAuthorizedException: "Correo o contraseña incorrectos.",
          UserNotFoundException: "No existe una cuenta con ese correo.",
          UserNotConfirmedException: "Cuenta no confirmada. Revisa tu correo.",
          PasswordResetRequiredException: "Debes restablecer tu contraseña.",
        };
        reject(new Error(mensajes[err.code] ?? err.message));
      },
      newPasswordRequired: () =>
        resolve({ requiresNewPassword: true, cognitoUserPendiente: cognitoUser }),
    });
  });
}

export function CompletarNuevaContrasena(cognitoUserPendiente, nuevaContrasena) {
  return new Promise((resolve, reject) => {
    cognitoUserPendiente.completeNewPasswordChallenge(nuevaContrasena, {}, {
      onSuccess: (session) => resolve({ session }),
      onFailure: (err) => {
        const mensajes = {
          InvalidPasswordException: "La contraseña no cumple los requisitos de seguridad.",
          InvalidParameterException: "La contraseña no es válida.",
        };
        reject(new Error(mensajes[err.code] ?? err.message));
      },
    });
  });
}

export function CerrarSesion() {
  const usuario = ObtenerPool().getCurrentUser();
  if (usuario) usuario.signOut();
}

export function ObtenerSesionActual() {
  return new Promise((resolve) => {
    const usuario = ObtenerPool().getCurrentUser();
    if (!usuario) return resolve(null);

    usuario.getSession((err, session) => {
      resolve(!err && session?.isValid() ? session : null);
    });
  });
}

export function ObtenerToken() {
  return new Promise((resolve) => {
    const usuario = ObtenerPool().getCurrentUser();
    if (!usuario) return resolve(null);

    usuario.getSession((err, session) => {
      resolve(!err && session?.isValid()
        ? session.getIdToken().getJwtToken()
        : null);
    });
  });
}
