# Registro de cambios

## 2026-06-03

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
- [ ] FIXME: Añadir `favicon.svg` en `public/` (referenciado en `index.html`).
