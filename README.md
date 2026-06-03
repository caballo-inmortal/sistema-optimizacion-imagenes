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

Instrucciones detalladas: [aws/README.md](aws/README.md)

## Scripts

| Comando        | Descripción        |
|----------------|--------------------|
| `npm run dev`  | Servidor desarrollo |
| `npm run build`| Build producción   |
| `npm run lint` | ESLint             |

## Variables de entorno

Ver [.env.example](.env.example).
