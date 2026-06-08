# Guía de configuración AWS — CloudPix

Esta guía alinea **consola AWS** y el archivo **`.env`** del frontend.

## Resumen del flujo

| Paso | Componente | Qué hace |
|------|------------|----------|
| 1 | React (`.env`) | Llama a API Gateway con `fileName` y `contentType` |
| 2 | API Gateway | Enruta `POST /upload` a la Lambda |
| 3 | Lambda `presigned-url-imagenes` | Genera `uploadUrl` (PUT) y `viewUrl` (GET) |
| 4 | Navegador | Sube el archivo con PUT directo a S3 |

---

## Paso 1 — Bucket S3

1. **S3 → Create bucket**
   - Nombre ejemplo: `sistema-imagenes-prod` (debe ser **único globalmente**).
   - Región: `us-east-1` (o la que uses en todo el proyecto).
2. **Permissions → CORS**:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

3. Anota el **nombre del bucket** → va en `.env` como `VITE_S3_BUCKET` y en Lambda como `BUCKET_NAME`.

---

## Paso 2 — Lambda

1. Código en: `aws/lambda/presigned-url/`
2. En tu PC (con Node.js):

```bash
cd aws/lambda/presigned-url
npm install
```

3. Empaqueta y sube a Lambda **Node.js 20.x** (nombre sugerido: `presigned-url-imagenes`).

### Variables de entorno en Lambda

| Variable | Valor |
|----------|--------|
| `BUCKET_NAME` | Mismo nombre que `VITE_S3_BUCKET` |
| `UPLOAD_PREFIX` | `uploads` (opcional) |

### Rol IAM (mínimo)

La Lambda necesita **PUT y GET** en el prefijo de subida (para `viewUrl`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::TU-BUCKET/uploads/*"
    }
  ]
}
```

Reemplaza `TU-BUCKET` por tu bucket real.

---

## Paso 3 — API Gateway (HTTP API)

1. **Create API → HTTP API**
2. **Integrations**: Lambda `presigned-url-imagenes`
3. **Routes**: `POST /upload` → integración Lambda
4. **CORS** (en la API o en la ruta):
   - Allow origins: `http://localhost:5173`, `5174`, `5175` (puertos de Vite)
   - Allow methods: `POST`, `OPTIONS`
   - Allow headers: `Content-Type`
5. **Deploy** a un stage (`$default` o `prod`)
6. Copia la **URL de invocación**:
   - Formato típico:  
     `https://{api-id}.execute-api.us-east-1.amazonaws.com/upload`

En este proyecto (según registro previo) el API ID puede ser `6fmq9y9lg6` — **confírmalo en la consola**.

---

## Paso 4 — Archivo `.env` (frontend)

En la raíz del proyecto:

```bash
cp .env.example .env
```

Edita `.env`:

```env
VITE_UPLOAD_API_URL=https://TU-API-ID.execute-api.us-east-1.amazonaws.com/upload
VITE_S3_BUCKET=tu-bucket-real
VITE_AWS_REGION=us-east-1
```

Reinicia el servidor de desarrollo:

```bash
npm run dev
```

La app deja de mostrar *"Configura .env..."* cuando `VITE_UPLOAD_API_URL` y `VITE_S3_BUCKET` tienen valor.

---

## Paso 5 — Comprobar que todo funciona

### A) Probar la API (PowerShell)

```powershell
$body = '{"fileName":"prueba.jpg","contentType":"image/jpeg"}'
Invoke-RestMethod -Uri "https://6fmq9y9lg6.execute-api.us-east-1.amazonaws.com/upload" -Method POST -Body $body -ContentType "application/json"
```

Debe devolver JSON con `uploadUrl`, `viewUrl`, `key`, `bucket`.

### B) Probar en la app

1. `npm run dev`
2. Elige una imagen JPG/PNG/WebP
3. **Subir imagen(es)**
4. Estado **En la nube** y galería con vista previa

### C) CloudWatch

**Lambda → Monitor → View logs** — busca `presigned_url_generada`.

---

## Errores frecuentes

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| Aviso "Configura .env" | Falta `.env` o variables vacías | Crear `.env` y reiniciar Vite |
| CORS en navegador | API Gateway sin CORS o origen incorrecto | Añadir `http://localhost:PUERTO` |
| Error S3 403 al PUT | CORS del bucket o URL expirada | Revisar CORS S3; URL válida 5 min |
| API 500 `BUCKET_NAME` | Lambda sin variable de entorno | Definir `BUCKET_NAME` en Lambda |
| `viewUrl` no abre imagen | IAM sin `s3:GetObject` | Ampliar política IAM (ver arriba) |
| URL API incorrecta | Stage o ruta distinta | Copiar URL exacta desde API Gateway |

---

## Siguiente fase (optimización)

Trigger **S3 → Lambda** al crear objetos en `uploads/` para generar versiones en `optimized/` (Sharp). Ver `aws/README.md`.
