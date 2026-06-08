# Listar imágenes de S3 — configuración AWS

La galería llama a **POST /list** (misma Lambda que `/upload`).

## 1. API Gateway

1. **API Gateway** → `cloudpix-upload-api` → **Routes** → **Create**
2. Método: **POST**
3. Ruta: **`/list`**
4. Integración: `presigned-url-imagenes`
5. Guardar (auto-deploy en `$default`)

La URL del frontend se deriva sola: cambia `/upload` por `/list` en `.env`.

## 2. Permiso IAM (rol de la Lambda)

En el rol `presigned-url-imagenes-role-...` → política inline → edita JSON y añade:

```json
{
  "Effect": "Allow",
  "Action": "s3:ListBucket",
  "Resource": "arn:aws:s3:::cloudpix-fredy-2026-866017706103-us-east-2-an",
  "Condition": {
    "StringLike": {
      "s3:prefix": ["uploads/*"]
    }
  }
}
```

Debe quedar junto con `s3:PutObject` y `s3:GetObject` en `uploads/*`.

## 3. Código Lambda

Actualiza la Lambda con el handler que incluye la ruta `/list`.

- Con zip: sube `aws/lambda-deploy.zip` generado desde `aws/lambda/presigned-url/`
- En consola: copia el bloque **ManejarListado** del chat o el archivo `index.mjs` del repo

Busca al inicio del handler:

```javascript
if (EsRutaListado(event)) {
  // listar objetos en uploads/ y devolver viewUrl por imagen
}
```

## 4. Probar

PowerShell:

```powershell
Invoke-RestMethod -Uri "https://jf5qia58x7.execute-api.us-east-1.amazonaws.com/list" -Method POST -Body "{}" -ContentType "application/json"
```

Debe devolver `{ "imagenes": [...], "total": N }`.

## 5. App

Reinicia `npm run dev` → **Ver imágenes en S3** muestra todo el bucket (prefijo `uploads/`).
