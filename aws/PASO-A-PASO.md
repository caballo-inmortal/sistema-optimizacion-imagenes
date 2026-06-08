# CloudPix — AWS paso a paso (sin marearte)

Sigue **un solo paso**, marca ✅ y solo entonces pasa al siguiente.

Tienes una hoja para apuntar (o un bloc):

```
BUCKET_NAME = _________________________
LAMBDA_NAME = presigned-url-imagenes
API_URL     = _________________________
REGION      = us-east-1
```

---

## Antes de empezar (2 minutos)

- [ ] Tienes cuenta en https://aws.amazon.com (plan Free Tier vale).
- [ ] Sabes iniciar sesión en la **Consola AWS**.
- [ ] En la consola, arriba a la derecha, deja la región en **US East (N. Virginia) / us-east-1**.

> Todo el proyecto usa **una sola región**. Si cambias de región, las cosas “desaparecen”.

---

## PASO 1 — Crear el “cajón” de fotos (bucket S3)

**Objetivo:** un lugar en la nube donde se guardan las imágenes.

1. En el buscador de la consola escribe **S3** → Enter.
2. **Create bucket**.
3. **Bucket name:** inventa uno único, solo minúsculas y guiones, por ejemplo:  
   `cloudpix-fredy-2026`  
   (si dice que el nombre ya existe, prueba otro).
4. **AWS Region:** `US East (N. Virginia) us-east-1`.
5. Deja el resto por defecto → **Create bucket**.
6. Entra al bucket que creaste → pestaña **Permissions** → baja a **Cross-origin resource sharing (CORS)** → **Edit**.
7. Pega esto y **Save changes**:

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

8. Apunta el nombre del bucket en tu hoja:  
   `BUCKET_NAME = cloudpix-fredy-2026` (el que hayas puesto).

### ✅ Paso 1 listo si…

- Ves tu bucket en la lista de S3.
- CORS guardado sin error.

**Para cuando termines:** escribe en el chat *“listo paso 1”* y el nombre de tu bucket.

---

## PASO 2 — Crear la función Lambda (el “cerebro”)

**Objetivo:** una función que genera enlaces seguros para subir fotos.

### 2A — Rol (permisos) de la Lambda

1. Busca **IAM** → **Roles** → **Create role**.
2. **Trusted entity:** AWS service → **Lambda** → Next.
3. **Permissions:** busca y marca **AWSLambdaBasicExecutionRole** → Next.
4. **Role name:** `cloudpix-lambda-s3-role` → **Create role**.
5. Entra al rol → **Add permissions** → **Create inline policy** → pestaña **JSON**.
6. Pega (cambia `TU-BUCKET` por tu `BUCKET_NAME` del Paso 1):

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

7. **Next** → nombre de política: `cloudpix-s3-upload-read` → **Create policy**.

### 2B — Empaquetar el código en tu PC

En PowerShell, en la carpeta del proyecto:

```powershell
Set-Location "C:\Users\FREDY\Documents\GitHub\sistema-optimizacion-imagenes\aws\lambda\presigned-url"
npm install
Compress-Archive -Path index.mjs, package.json, node_modules -DestinationPath ..\..\lambda-deploy.zip -Force
```

Debe existir: `aws\lambda-deploy.zip`

### 2C — Crear la función en la consola

1. Busca **Lambda** → **Create function**.
2. **Author from scratch**.
3. **Function name:** `presigned-url-imagenes`
4. **Runtime:** Node.js 20.x
5. **Architecture:** x86_64
6. **Permissions:** **Use an existing role** → `cloudpix-lambda-s3-role`
7. **Create function**.
8. En la función → **Upload from** → **.zip file** → sube `aws\lambda-deploy.zip`.
9. **Configuration** → **Environment variables** → **Edit** → Add:

| Key | Value |
|-----|--------|
| `BUCKET_NAME` | tu bucket del Paso 1 |
| `UPLOAD_PREFIX` | `uploads` |

10. **Save**.

### ✅ Paso 2 listo si…

- La función existe y el zip se subió sin error.
- Variables `BUCKET_NAME` y `UPLOAD_PREFIX` guardadas.

**Para cuando termines:** *“listo paso 2”*

---

## PASO 3 — Crear la puerta de entrada (API Gateway)

**Objetivo:** que tu app React pueda llamar a la Lambda por internet.

1. Busca **API Gateway** → **Create API**.
2. Tipo **HTTP API** → **Build**.
3. **Integrations:** **Add integration** → Lambda → región `us-east-1` → función `presigned-url-imagenes` → **Next**.
4. **API name:** `cloudpix-upload-api` → **Next**.
5. **Routes:** método **POST**, ruta `/upload`, integración = tu Lambda → **Next**.
6. **Stages:** deja `$default` → **Next** → **Create**.
7. En la API creada → menú izquierdo **Stages** → stage `$default`.
8. Copia **Invoke URL** (algo como `https://abc123.execute-api.us-east-1.amazonaws.com`).
9. Tu URL final para el `.env` suele ser esa URL + `/upload`, ejemplo:  
   `https://abc123.execute-api.us-east-1.amazonaws.com/upload`

10. **CORS** (misma API): **CORS** en el menú → Configure:
    - Access-Control-Allow-Origin: `http://localhost:5173` (puedes añadir 5174, 5175)
    - Allow-Methods: `POST`, `OPTIONS`
    - Allow-Headers: `Content-Type`
    - **Save**

Apunta: `API_URL = https://....amazonaws.com/upload`

### ✅ Paso 3 listo si…

- Tienes la URL copiada.
- CORS guardado.

**Para cuando termines:** *“listo paso 3”* y pega tu URL (sin secretos aparte de eso).

---

## PASO 4 — Conectar tu app (archivo `.env`)

En la raíz del proyecto, archivo `.env`:

```env
VITE_UPLOAD_API_URL=https://TU-API-ID.execute-api.us-east-1.amazonaws.com/upload
VITE_S3_BUCKET=tu-bucket-del-paso-1
VITE_AWS_REGION=us-east-1
```

Reemplaza con **tus** valores del Paso 1 y 3.

Reinicia Vite (cierra la terminal y otra vez):

```powershell
Set-Location "C:\Users\FREDY\Documents\GitHub\sistema-optimizacion-imagenes"
npm run dev
```

### ✅ Paso 4 listo si…

- Ya no sale el aviso amarillo de “Configura .env” (o solo falta reiniciar).

**Para cuando termines:** *“listo paso 4”*

---

## PASO 5 — Probar subida

1. Abre la app en el navegador (la URL que diga Vite, ej. `http://localhost:5173`).
2. **Elegir imágenes** → una foto JPG o PNG pequeña.
3. **Subir imagen(es)**.
4. Debe pasar a **En la nube**.

Si falla, mira **F12 → Console** y **Network** (error en API o en S3).

### Prueba rápida de la API (PowerShell)

```powershell
$body = '{"fileName":"prueba.jpg","contentType":"image/jpeg"}'
Invoke-RestMethod -Uri "TU_URL_COMPLETA/upload" -Method POST -Body $body -ContentType "application/json"
```

Debe devolver `uploadUrl`, `viewUrl`, `key`.

---

## Mapa mental (para no perderte)

```
Tu PC (React + .env)
    ↓ POST
API Gateway (/upload)
    ↓
Lambda (genera enlaces)
    ↓
S3 (guarda el archivo)
```

Solo **4 cosas** en AWS: S3, IAM rol, Lambda, API Gateway.

---

## ¿Te mareas? Haz solo esto ahora

**Hoy:** solo **PASO 1** (bucket + CORS).  
Cuando termines, dime *“listo paso 1”* y seguimos con el Paso 2 juntos.
