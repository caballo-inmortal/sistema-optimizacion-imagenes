# Despliegue AWS — Subida múltiple a S3

Flujo: **React** → **API Gateway** → **Lambda** (URL prefirmada) → **PUT directo a S3**.

## 1. Bucket S3

1. Crea un bucket (ej. `sistema-imagenes-prod`).
2. En **Permissions → CORS**, agrega:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

En producción reemplaza `"*"` en `AllowedOrigins` por la URL de tu app (ej. `http://localhost:5173`).

## 2. Lambda `presigned-url`

```bash
cd aws/lambda/presigned-url
npm install
```

Empaqueta `index.mjs`, `node_modules` y sube a Lambda (Node.js 20.x).

**Variables de entorno:**

| Variable        | Ejemplo              |
|-----------------|----------------------|
| `BUCKET_NAME`   | `sistema-imagenes-prod` |
| `UPLOAD_PREFIX` | `uploads` (opcional) |

**Política IAM** (adjunta al rol de la Lambda):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::TU-BUCKET/uploads/*"
    }
  ]
}
```

## 3. API Gateway (HTTP API)

- Método **POST** → integración con la Lambda.
- Ruta sugerida: `/upload`
- Habilita **CORS** (origen de tu frontend).
- Despliega el stage y copia la URL invocable.

## 4. Frontend

Copia `.env.example` a `.env` en la raíz del proyecto:

```env
VITE_UPLOAD_API_URL=https://xxxx.execute-api.us-east-1.amazonaws.com/upload
VITE_S3_BUCKET=sistema-imagenes-prod
VITE_AWS_REGION=us-east-1
```

```bash
npm run dev
```

## 5. CloudWatch

Los logs de la Lambda registran cada URL generada (`presigned_url_generada`). Revisa **CloudWatch → Log groups** del nombre de tu función.

## Siguiente paso (optimización)

Un trigger **S3 → Lambda** al crear objetos en `uploads/` puede redimensionar/comprimir y guardar en `optimized/` (Sharp en Node.js).
