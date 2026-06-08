# Sistema de Optimización de Imágenes en la Nube

Aplicación React + Vite para **subir múltiples imágenes** y guardarlas en **Amazon S3** usando **Lambda** (URLs prefirmadas) y **API Gateway**.

## Inicio rápido (frontend)

```bash
npm install
cp .env.example .env
# Edita .env con tu URL de API Gateway y nombre del bucket
npm run dev
```

## Arquitectura

```
Usuario → React (multi-file)
       → POST API Gateway
       → Lambda genera presigned URL
       → PUT directo a S3
       → Logs en CloudWatch
```

## Configuración AWS

1. **Empieza aquí (fácil):** [aws/PASO-A-PASO.md](aws/PASO-A-PASO.md)
2. Guía técnica completa: [aws/GUIA-CONFIGURACION-AWS.md](aws/GUIA-CONFIGURACION-AWS.md)
2. Referencia técnica Lambda/API: [aws/README.md](aws/README.md)

## Scripts

| Comando        | Descripción        |
|----------------|--------------------|
| `npm run dev`  | Servidor desarrollo |
| `npm run build`| Build producción   |
| `npm run lint` | ESLint             |

## Variables de entorno

Ver [.env.example](.env.example). Región actual del despliegue: **us-east-2**.

```env
VITE_UPLOAD_API_URL=https://TU-API-ID.execute-api.us-east-2.amazonaws.com/upload
VITE_S3_BUCKET=cloudpix-fredy-2026-866017706103-us-east-2-an
VITE_AWS_REGION=us-east-2
```

La **Invoke URL** se copia en API Gateway → `cloudpix-upload-api` → Stages → `$default`.
