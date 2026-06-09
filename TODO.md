# Registro de cambios

## 2026-06-03 (informe)

- [x] Creado `INFORME-TECNICO.md` — análisis del proyecto y configuración AWS documentada.
- [x] Generado `INFORME-TECNICO.docx` (Word) con `scripts/GenerarInformeWord.py`.

## 2026-06-08

- [x] **FIXME resuelto**: `galeria.cargar()` → `galeria.cargarDesdeS3()` en `App.jsx`. Llamar función inexistente lanzaba `TypeError` al abrir galería.
- [x] **Drag & Drop real**: `ZonaArrastre` acepta archivos arrastrados (`onDrop`, `onDragOver`, `onDragLeave`) con estado visual `.ZonaArrastre--activa`.
- [x] **Límite de tamaño**: `TamanoMaximoBytes` (10 MB) en `ImageValidation.js` + validación en `procesarArchivos`.
- [x] **Botón Reintentar**: aparece cuando hay imágenes en estado `error`, reutiliza `subirTodas`.
- [x] **Descarga en lightbox**: enlace "Descargar" junto a "Abrir en nueva pestaña" con atributo `download`.
- [x] **Código muerto eliminado**: `SubirImagenesAS3` removida de `S3UploadService.js` (no se usaba).

## 2026-06-08 — Login con AWS Cognito

- [x] Instalado `amazon-cognito-identity-js`.
- [x] `src/config/CognitoConfig.js`: lee `VITE_COGNITO_USER_POOL_ID` y `VITE_COGNITO_CLIENT_ID` desde `.env`.
- [x] `src/services/AuthService.js`: `IniciarSesion`, `CerrarSesion`, `ObtenerSesionActual`, `ObtenerToken`.
- [x] `src/hooks/useAuth.js`: estado de sesión, login y logout reactivos.
- [x] `src/components/PantallaLogin.jsx` + `PantallaLogin.css`: pantalla de acceso con branding CloudPix.
- [x] `App.jsx`: guard de autenticación (spinner → login → app), email del usuario + botón "Cerrar sesión" en el header.
- [x] `S3UploadService.js`: token JWT de Cognito enviado en header `Authorization` en cada llamada a la API.
- [x] `.env.example` actualizado con variables de Cognito.
- [x] User Pool creado en Cognito (`us-east-2_bHyMb4xWL`) + App Client configurado.
- [x] Proxy Vite (`/api-gw`) para evitar CORS en desarrollo — `VITE_UPLOAD_API_URL=/api-gw/upload`.
- [x] `vite.config.js`: `global: 'globalThis'` para compatibilidad de `amazon-cognito-identity-js` en el navegador.
- [x] `useAuth.js`: try/catch en `login` y `completarNuevaContrasena` para mostrar errores en pantalla.
- [x] Flujo `newPasswordRequired` implementado: paso 2 en el login para usuarios con contraseña temporal de Cognito.

## 2026-06-03 (tarde)

- [x] `.env` y `.env.example` actualizados: bucket `cloudpix-fredy-2026-866017706103-us-east-2-an`, región `us-east-2`.
- [x] `AwsConfig.js`: valores por defecto del bucket y región us-east-2.
- [x] `S3UploadService.js`: mensaje claro si la API responde 404 (URL incorrecta en `.env`).
- [x] Lambda repo `index.mjs`: región por defecto `us-east-2`.
- [x] `.env` con `VITE_UPLOAD_API_URL` → `jf5qia58x7.execute-api.us-east-1.amazonaws.com/upload`.
- [x] CORS bucket S3 con localhost 5173–5175.
- [x] Galería: respaldo con imágenes de sesión cuando POST `/list` falla (404).
- [x] Ruta `POST /list` creada en API Gateway + integración a Lambda existente.
- [x] Política `ListBucketCloudPix` (`s3:ListBucket`) agregada al rol Lambda.
- [x] Lambda actualizada con código que maneja `/list` y `/upload` en la misma función.
- [x] Galería carga todas las imágenes reales del bucket S3.

## 2026-06-03

- [x] Guía simplificada `aws/PASO-A-PASO.md` (5 pasos, uno a la vez).
- [x] Creado `.env` con API Gateway (`6fmq9y9lg6`) y bucket `sistema-imagenes-prod` (verificar en consola AWS).
- [x] Guía `aws/GUIA-CONFIGURACION-AWS.md` (checklist S3, Lambda, API Gateway, pruebas).
- [x] IAM en `aws/README.md`: añadido `s3:GetObject` para URLs de lectura.
- [x] Subida múltiple de imágenes (JPG, PNG, WebP) con vista previa por archivo.
- [x] Integración AWS: flujo React → API Gateway → Lambda → S3 (URLs prefirmadas).
- [x] Servicio `S3UploadService`, hook `useMultiImageUpload`, configuración `.env`.
- [x] Lambda `aws/lambda/presigned-url` y guía de despliegue en `aws/README.md`.
- [ ] TODO: Lambda de optimización disparada por evento S3 (`optimized/`).
- [x] Bucket S3, Lambda `presigned-url-imagenes`, API Gateway desplegado.
- [x] `.env` configurado con URL `6fmq9y9lg6.execute-api...`.
- [x] CORS API Gateway y subida a S3 verificada.
- [x] URL firmada de lectura (`viewUrl`) en Lambda y enlace en la app.
- [x] Rediseño UI CloudPix: galería modal, lightbox y estilo llamativo.
- [ ] TODO: Restringir CORS de S3 y API Gateway al dominio de producción.
- [x] `favicon.svg` y `favicon.ico` en `public/`; enlace en `index.html`.
