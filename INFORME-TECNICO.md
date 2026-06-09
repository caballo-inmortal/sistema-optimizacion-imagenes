# Informe Técnico — CloudPix Studio

**Sistema de Optimización y Gestión de Imágenes en la Nube**

| Campo | Valor |
|-------|--------|
| **Proyecto** | sistema-optimizacion-imagenes |
| **Aplicación** | CloudPix Studio |
| **Cuenta AWS** | `866017706103` |
| **Fecha del informe** | 9 de junio de 2026 (actualizado) |
| **Estado** | Operativo — login Cognito, subida S3, galería completa verificados |

---

## Tabla de contenidos

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Objetivo del sistema](#2-objetivo-del-sistema)
3. [Arquitectura general](#3-arquitectura-general)
4. [Stack tecnológico](#4-stack-tecnológico)
5. [Estructura del proyecto](#5-estructura-del-proyecto)
6. [Frontend — diseño e implementación](#6-frontend--diseño-e-implementación)
7. [Backend — configuración AWS](#7-backend--configuración-aws)
8. [Flujos de operación](#8-flujos-de-operación)
9. [Variables de entorno](#9-variables-de-entorno)
10. [Seguridad y CORS](#10-seguridad-y-cors)
11. [Estado funcional actual](#11-estado-funcional-actual)
12. [Trabajo pendiente y roadmap](#12-trabajo-pendiente-y-roadmap)
13. [Guía rápida de ejecución local](#13-guía-rápida-de-ejecución-local)
14. [Referencias del repositorio](#14-referencias-del-repositorio)

---

## 1. Resumen ejecutivo

**CloudPix Studio** es una aplicación web de página única (SPA) que permite **subir múltiples imágenes** (JPG, PNG, WebP) a **Amazon S3** mediante un flujo seguro basado en **URLs prefirmadas**. La lógica de backend reside en **AWS Lambda**, expuesta a internet a través de **API Gateway (HTTP API)**.

El frontend corre en local con **Vite + React 19** y se comunica con AWS sin almacenar credenciales: el navegador obtiene URLs firmadas desde Lambda y sube los archivos **directamente a S3**.

La galería consulta el bucket completo (prefijo `uploads/`) mediante el endpoint **`POST /list`**, mostrando todas las imágenes almacenadas, no solo las de la sesión actual.

---

## 2. Objetivo del sistema

| Objetivo | Descripción |
|----------|-------------|
| **Subida masiva** | Seleccionar y subir hasta 50 imágenes por lote con barra de progreso por archivo |
| **Almacenamiento en nube** | Persistir imágenes en S3 bajo el prefijo `uploads/` |
| **Visualización** | Galería modal y lightbox con URLs firmadas de lectura |
| **Seguridad** | Sin credenciales AWS en el cliente; acceso público al bucket bloqueado |
| **Optimización** *(roadmap)* | Procesamiento automático post-subida (Lambda + Sharp → carpeta `optimized/`) |

---

## 3. Arquitectura general

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USUARIO (Navegador)                             │
│                    http://localhost:5173–5175                           │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │ POST /upload        │ POST /list          │ PUT directo
          ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────────┐
│  API Gateway    │   │  API Gateway    │   │  Amazon S3              │
│  HTTP API       │──▶│  cloudpix-      │   │  cloudpix-fredy-2026-   │
│  (us-east-1)    │   │  upload-api     │   │  866017706103-us-east-2 │
└────────┬────────┘   └────────┬────────┘   └─────────────────────────┘
         │                     │                     ▲
         └──────────┬──────────┘                     │
                    ▼                                │
         ┌─────────────────────┐                     │
         │  AWS Lambda         │─────────────────────┘
         │  presigned-url-     │   URLs prefirmadas PUT / GET
         │  imagenes           │   ListObjectsV2 (/list)
         │  (us-east-2)        │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  CloudWatch Logs    │
         └─────────────────────┘
```

### Capas del sistema

| Capa | Servicio | Responsabilidad |
|------|----------|-----------------|
| **Presentación** | React + Vite | UI, cola de subida, galería, lightbox |
| **API** | API Gateway HTTP | Enrutamiento, CORS, exposición pública |
| **Lógica** | Lambda Node.js 20/24 | URLs prefirmadas, listado S3 |
| **Almacenamiento** | S3 | Objetos bajo `uploads/{timestamp}-{nombre}` |
| **Permisos** | IAM (rol Lambda) | PutObject, GetObject, ListBucket |
| **Observabilidad** | CloudWatch | Logs de Lambda |

> **Nota regional:** El bucket S3 y la Lambda están en **us-east-2 (Ohio)**. API Gateway está desplegado en **us-east-1 (N. Virginia)**. El flujo funciona correctamente, aunque lo ideal a futuro es unificar región.

---

## 4. Stack tecnológico

### Frontend

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 19.2.x | Interfaz de usuario |
| Vite | 8.x | Bundler y servidor de desarrollo |
| JavaScript (ES Modules) | — | Sin TypeScript en código fuente |
| CSS vanilla | — | Estilos (`App.css`, `index.css`) |
| ESLint | 10.x | Linting |

### Backend (AWS)

| Tecnología | Uso |
|------------|-----|
| Amazon S3 | Almacenamiento de objetos |
| AWS Lambda | Generación de URLs y listado |
| API Gateway (HTTP API) | Endpoints REST |
| IAM | Rol de ejecución Lambda |
| AWS SDK v3 (`@aws-sdk/client-s3`) | Código Lambda en repositorio |

### Dependencias frontend (producción)

Solo **react** y **react-dom**. No hay librería UI externa ni AWS SDK en el cliente.

---

## 5. Estructura del proyecto

```
sistema-optimizacion-imagenes/
├── public/                    # Favicon e iconos estáticos
├── src/
│   ├── App.jsx                # Componente principal (CloudPix Studio)
│   ├── App.css                # Estilos de la aplicación
│   ├── main.jsx               # Punto de entrada React
│   ├── index.css              # Estilos globales
│   ├── config/
│   │   └── AwsConfig.js       # Variables VITE_* y URLs derivadas
│   ├── hooks/
│   │   ├── useMultiImageUpload.js   # Cola, subida, estados
│   │   └── useGaleriaS3.js          # Listado desde S3
│   ├── services/
│   │   └── S3UploadService.js       # fetch API + XHR PUT a S3
│   └── utils/
│       └── ImageValidation.js       # Tipos MIME y formateo
├── aws/
│   ├── lambda/presigned-url/
│   │   ├── index.mjs          # Handler Lambda (upload + list)
│   │   └── package.json       # Dependencias SDK
│   ├── PASO-A-PASO.md         # Guía AWS simplificada
│   ├── GUIA-CONFIGURACION-AWS.md
│   ├── LISTAR-IMAGENES-AWS.md
│   └── README.md
├── .env.example               # Plantilla de configuración
├── INFORME-TECNICO.md         # Este documento
├── README.md
├── TODO.md                    # Registro de cambios
├── package.json
└── vite.config.js
```

---

## 6. Frontend — diseño e implementación

### 6.1 Interfaz (CloudPix Studio)

La UI se organiza en dos paneles principales:

| Sección | Función |
|---------|---------|
| **Zona de carga** | Selector múltiple de archivos, estadísticas, acciones |
| **Cola de trabajo** | Lista con miniatura, estado, progreso y errores por imagen |
| **Galería modal** | Grid de imágenes del bucket S3 |
| **Lightbox** | Vista ampliada con enlace a URL firmada |

Estados por imagen en cola: `listo` → `subiendo` → `exito` / `error`.

Tras una subida exitosa, las imágenes **salen automáticamente de la cola** y el contador **En S3** se actualiza consultando el bucket.

### 6.2 Módulos clave

#### `AwsConfig.js`

Centraliza configuración desde variables de entorno Vite:

- `VITE_UPLOAD_API_URL` — endpoint de subida
- `VITE_S3_BUCKET` — nombre del bucket
- `VITE_AWS_REGION` — región del bucket

Deriva automáticamente la URL de listado: `/upload` → `/list`.

#### `S3UploadService.js`

| Función | Descripción |
|---------|-------------|
| `ObtenerUrlPrefirmada()` | POST a `/upload` con `fileName` y `contentType` |
| `SubirImagenAS3()` | PUT directo a S3 vía XMLHttpRequest con progreso |
| `ListarImagenesDesdeS3()` | POST a `/list`; devuelve `{ imagenes, total }` |

#### `useMultiImageUpload.js`

- Gestiona cola de archivos locales (ObjectURL para previews)
- Subida secuencial con reintento manual en errores
- Límite: 50 imágenes por lote
- Callback `onSubidaExitosa` para refrescar galería

#### `useGaleriaS3.js`

- Carga imágenes al iniciar (si `.env` está configurado)
- Expone `cargar()`, `total`, `cargando`, `error`
- Cada ítem: `{ key, viewUrl, nombre, tamano, fecha }`

#### `ImageValidation.js`

Formatos permitidos: `image/jpeg`, `image/png`, `image/webp`.

---

## 7. Backend — configuración AWS

Esta sección documenta la **configuración real desplegada** en la cuenta `866017706103`.

### 7.1 Amazon S3

| Parámetro | Valor |
|-----------|--------|
| **Nombre del bucket** | `cloudpix-fredy-2026-866017706103-us-east-2-an` |
| **Región** | `us-east-2` (Ohio) |
| **Prefijo de subida** | `uploads/` |
| **Acceso público** | Bloqueado (Block Public Access activado) |
| **Propiedad de objetos** | Bucket owner enforced (ACL deshabilitadas) |
| **Cifrado** | SSE-S3 (predeterminado) |

#### CORS del bucket

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

> Necesario para que el navegador pueda hacer **PUT directo** a S3 desde localhost.

---

### 7.2 AWS Lambda

| Parámetro | Valor |
|-----------|--------|
| **Nombre** | `presigned-url-imagenes` |
| **Runtime** | Node.js 24.x |
| **Handler** | `index.handler` |
| **Región** | `us-east-2` |
| **ARN** | `arn:aws:lambda:us-east-2:866017706103:function:presigned-url-imagenes` |

#### Variables de entorno

| Variable | Valor |
|----------|--------|
| `BUCKET_NAME` | `cloudpix-fredy-2026-866017706103-us-east-2-an` |
| `UPLOAD_PREFIX` | `uploads` |

#### Rol IAM de ejecución

| Parámetro | Valor |
|-----------|--------|
| **Nombre del rol** | `presigned-url-imagenes-role-y7rfhqww` |
| **ARN** | `arn:aws:iam::866017706103:role/service-role/presigned-url-imagenes-role-y7rfhqww` |
| **Política administrada** | `AWSLambdaBasicExecutionRole` (CloudWatch Logs) |
| **Política inline** | `s3-upload-read` |

#### Permisos IAM requeridos

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::cloudpix-fredy-2026-866017706103-us-east-2-an/uploads/*"
    },
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
  ]
}
```

> `s3:ListBucket` es necesario para el endpoint **`POST /list`** (galería).

#### Rutas soportadas por el handler

| Ruta | Método | Acción |
|------|--------|--------|
| `/upload` | POST | Genera `uploadUrl` (PUT, 5 min) y `viewUrl` (GET, 1 h) |
| `/list` | POST | Lista objetos en `uploads/` y devuelve URLs de lectura |
| * | OPTIONS | Respuesta CORS para preflight |

#### Formato de respuesta `/upload`

```json
{
  "uploadUrl": "https://...s3.us-east-2.amazonaws.com/uploads/...",
  "viewUrl": "https://...s3.us-east-2.amazonaws.com/uploads/...",
  "key": "uploads/1780519422620-prueba.jpg",
  "bucket": "cloudpix-fredy-2026-866017706103-us-east-2-an",
  "region": "us-east-2"
}
```

#### Formato de respuesta `/list`

```json
{
  "imagenes": [
    {
      "key": "uploads/1780519422620-prueba.jpg",
      "viewUrl": "https://...",
      "nombre": "prueba.jpg",
      "tamano": 245760,
      "fecha": "2026-06-03T20:43:42.000Z"
    }
  ],
  "total": 1
}
```

---

### 7.3 API Gateway (HTTP API)

| Parámetro | Valor |
|-----------|--------|
| **Nombre** | `cloudpix-upload-api` |
| **Tipo** | HTTP API |
| **Región** | `us-east-1` (N. Virginia) |
| **Stage** | `$default` (auto-deploy habilitado) |
| **Invoke URL** | `https://jf5qia58x7.execute-api.us-east-1.amazonaws.com` |

#### Rutas configuradas

| Método | Ruta | Integración | Estado |
|--------|------|-------------|--------|
| POST | `/upload` | `presigned-url-imagenes` | ✅ Desplegada |
| POST | `/list` | `presigned-url-imagenes` | ⚠️ Pendiente de confirmar |

#### CORS (API Gateway)

| Campo | Valor |
|-------|--------|
| **Allow-Origin** | `http://localhost:5173`, `5174`, `5175` |
| **Allow-Methods** | `POST`, `OPTIONS` |
| **Allow-Headers** | `Content-Type` |
| **Max-Age** | `86400` |
| **Allow-Credentials** | `NO` |

---

### 7.4 Resumen de recursos AWS

| Recurso | Identificador | Región |
|---------|---------------|--------|
| Bucket S3 | `cloudpix-fredy-2026-866017706103-us-east-2-an` | us-east-2 |
| Lambda | `presigned-url-imagenes` | us-east-2 |
| Rol IAM | `presigned-url-imagenes-role-y7rfhqww` | global |
| API Gateway | `cloudpix-upload-api` (`jf5qia58x7`) | us-east-1 |

---

## 8. Flujos de operación

### 8.1 Subida de imagen

```
1. Usuario selecciona archivo(s) en React
2. Validación MIME (JPG, PNG, WebP)
3. POST /upload → Lambda genera URLs firmadas
4. Navegador PUT directo a S3 (con Content-Type)
5. Cola se limpia para archivos exitosos
6. Galería se refresca (POST /list)
```

### 8.2 Visualización de galería

```
1. Usuario pulsa "Ver imágenes en S3"
2. POST /list → Lambda ejecuta ListObjectsV2
3. Por cada imagen: genera viewUrl firmada (1 h)
4. Frontend renderiza grid ordenado por fecha (más reciente primero)
```

### 8.3 Convención de nombres en S3

```
uploads/{timestamp}-{nombre_sanitizado}
```

Ejemplo: `uploads/1780519422620-Captura_de_pantalla_2026-04-24_193502.png`

---

## 9. Variables de entorno

Archivo `.env` en la raíz (no versionado en Git):

```env
VITE_UPLOAD_API_URL=https://jf5qia58x7.execute-api.us-east-1.amazonaws.com/upload
VITE_S3_BUCKET=cloudpix-fredy-2026-866017706103-us-east-2-an
VITE_AWS_REGION=us-east-2
```

| Variable | Descripción |
|----------|-------------|
| `VITE_UPLOAD_API_URL` | URL completa del endpoint POST `/upload` |
| `VITE_S3_BUCKET` | Nombre del bucket (referencia en UI) |
| `VITE_AWS_REGION` | Región del bucket S3 |

La URL de listado se deriva automáticamente en código (`/upload` → `/list`).

> **Importante:** Tras modificar `.env`, reiniciar `npm run dev`.

---

## 10. Seguridad y CORS

### Principios aplicados

| Principio | Implementación |
|-----------|----------------|
| **Sin credenciales en cliente** | Solo URLs prefirmadas de corta duración |
| **Bucket privado** | Block Public Access activado |
| **Validación de tipos** | Frontend y Lambda rechazan MIME no permitidos |
| **Prefijo acotado** | Objetos solo bajo `uploads/` |
| **IAM mínimo** | Permisos scoped al bucket y prefijo |

### Puntos de CORS

| Componente | Orígenes permitidos (dev) |
|------------|---------------------------|
| API Gateway | `localhost:5173`, `5174`, `5175` |
| S3 bucket | `localhost:5173`, `5174`, `5175` |

### Consideraciones para producción

- [ ] Restringir CORS al dominio de producción (eliminar `*`` si se usa en Lambda)
- [ ] Unificar regiones (API Gateway + Lambda + S3 en la misma)
- [ ] Evaluar autenticación en API Gateway (API keys, Cognito o JWT)
- [ ] Rotación y auditoría de permisos IAM

---

## 11. Estado funcional actual

| Funcionalidad | Estado |
|---------------|--------|
| Selección múltiple de imágenes | ✅ Operativo |
| Validación JPG / PNG / WebP | ✅ Operativo |
| Barra de progreso por archivo | ✅ Operativo |
| POST `/upload` + PUT a S3 | ✅ Verificado |
| CORS API Gateway | ✅ Configurado |
| CORS bucket S3 | ✅ Configurado |
| Limpieza automática de cola tras subida | ✅ Operativo |
| Galería desde bucket S3 (`POST /list`) | ⚠️ Requiere ruta + permiso ListBucket |
| Lightbox y enlace externo | ✅ Operativo |
| Optimización automática de imágenes | ❌ No implementado |

---

## 12. Trabajo pendiente y roadmap

### Corto plazo

1. **Confirmar despliegue de `POST /list`** en API Gateway y permiso `s3:ListBucket` en IAM
2. **Actualizar código Lambda** en consola con la versión del repositorio (`index.mjs`)
3. **Unificar región** — migrar API Gateway a `us-east-2` o documentar decisión de arquitectura

### Mediano plazo

4. **Lambda de optimización** — trigger S3 al crear objeto en `uploads/` → procesar con Sharp → guardar en `optimized/`
5. **Restringir CORS** al dominio de producción
6. **Drag & drop** en zona de carga (mencionado en UI, no implementado)

### Largo plazo

7. Autenticación de usuarios
8. Paginación en listado S3 (más de 1000 objetos)
9. CI/CD para frontend y Lambda
10. Tests automatizados (unitarios y E2E)

---

## 13. Guía rápida de ejecución local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
cp .env.example .env
# Editar .env con tus URLs y bucket

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir en navegador
# http://localhost:5173 (o el puerto que indique Vite)
```

### Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm run lint` | ESLint |

### Prueba de API (PowerShell)

```powershell
# Subida (URL prefirmada)
$body = '{"fileName":"prueba.jpg","contentType":"image/jpeg"}'
Invoke-RestMethod -Uri "https://jf5qia58x7.execute-api.us-east-1.amazonaws.com/upload" `
  -Method POST -Body $body -ContentType "application/json"

# Listado (galería)
Invoke-RestMethod -Uri "https://jf5qia58x7.execute-api.us-east-1.amazonaws.com/list" `
  -Method POST -Body "{}" -ContentType "application/json"
```

---

## 14. Referencias del repositorio

| Documento | Contenido |
|-----------|-----------|
| `README.md` | Inicio rápido del proyecto |
| `aws/PASO-A-PASO.md` | Guía AWS paso a paso (principiantes) |
| `aws/GUIA-CONFIGURACION-AWS.md` | Checklist técnico completo |
| `aws/LISTAR-IMAGENES-AWS.md` | Configuración del endpoint `/list` |
| `aws/README.md` | Despliegue Lambda y referencia IAM |
| `TODO.md` | Registro cronológico de cambios |

---

## Anexo A — Diagrama de secuencia (subida)

```
Usuario     React          API GW        Lambda         S3
  │            │               │             │            │
  │──archivo──▶│               │             │            │
  │            │──POST /upload─▶│────────────▶│            │
  │            │◀──uploadUrl────│◀────────────│            │
  │            │──PUT uploadUrl───────────────────────────▶│
  │            │◀──────────────200 OK───────────────────────│
  │◀──éxito────│               │             │            │
```

---

## Anexo B — Historial de configuraciones

| Fecha | Evento |
|-------|--------|
| Inicio | Configuración en cuenta/región distinta (`6fmq9y9lg6`, us-east-1) — deprecada |
| 3 jun 2026 | Nuevo bucket `cloudpix-fredy-2026-...` en us-east-2 |
| 3 jun 2026 | Lambda `presigned-url-imagenes` recreada (código en consola, sin zip) |
| 3 jun 2026 | API Gateway `cloudpix-upload-api` (`jf5qia58x7`) con POST `/upload` |
| 3 jun 2026 | CORS configurado en API Gateway y S3 |
| 3 jun 2026 | Subida desde localhost verificada |
| 3 jun 2026 | Galería S3 implementada en frontend (`POST /list`) |

---

*Documento generado como referencia técnica del proyecto CloudPix Studio. Para cambios en infraestructura AWS, actualizar este informe y `TODO.md`.*

---

## Anexo C — Mejoras implementadas el 8 de junio de 2026

### C.1 Resumen de la sesión

En esta sesión se realizaron mejoras significativas al proyecto en tres áreas: **corrección de bugs**, **mejoras de UX/funcionalidad en el frontend** y **autenticación con AWS Cognito**.

---

### C.2 Corrección de bugs

#### Bug crítico — `galeria.cargar()` no existía

| Campo | Detalle |
|-------|---------|
| **Archivo** | `src/App.jsx` línea 58 |
| **Problema** | Se llamaba `galeria.cargar()` pero el hook `useGaleriaS3` exporta `cargarDesdeS3`. Llamar una función `undefined` lanzaba un `TypeError` cada vez que el usuario abría la galería. |
| **Solución** | Renombrado a `galeria.cargarDesdeS3()` |
| **Impacto** | La galería era completamente inutilizable antes de este fix. |

---

### C.3 Mejoras de funcionalidad en el frontend

#### C.3.1 Drag & Drop real

Antes, la zona de carga decía "Arrastra o selecciona" pero solo funcionaba el botón de selección. Se implementaron los eventos necesarios:

| Evento | Función |
|--------|---------|
| `onDragOver` / `onDragEnter` | Activa estado visual y previene comportamiento por defecto del navegador |
| `onDragLeave` | Desactiva estado visual solo cuando el cursor sale de la zona (no de elementos hijos) |
| `onDrop` | Extrae archivos del evento y los procesa con `procesarArchivos()` |

Se agregó la clase `.ZonaArrastre--activa` en `App.css` con fondo naranja y borde sólido para feedback visual durante el arrastre.

La lógica de validación se extrajo del evento `onChange` a una función independiente `procesarArchivos(archivos: File[])` en `useMultiImageUpload.js`, reutilizable desde el input y desde el drop.

#### C.3.2 Límite de tamaño de archivo (10 MB)

Se agregaron dos exportaciones en `src/utils/ImageValidation.js`:

```js
export const TamanoMaximoBytes = 10 * 1024 * 1024; // 10 MB
export function EsTamanoValido(archivo) {
  return archivo.size <= TamanoMaximoBytes;
}
```

La validación se ejecuta en `procesarArchivos()` antes de agregar imágenes a la cola. Si algún archivo supera el límite, se muestra un mensaje de error y se rechaza el lote completo.

#### C.3.3 Botón "Reintentar fallidas"

Se agregó un contador `fallidas` al hook `useMultiImageUpload` (imágenes en estado `"error"`). En `App.jsx` aparece un botón rojo **"Reintentar X fallida(s)"** cuando `fallidas > 0` y no hay una subida en curso. Reutiliza la función `subirTodas()` que ya incluye las imágenes en estado `"error"` en su lista de pendientes.

#### C.3.4 Descarga en el lightbox

Se agregó un enlace de descarga en el pie del lightbox junto al ya existente "Abrir en nueva pestaña":

```jsx
<a href={imagenAmpliada.viewUrl} download={ObtenerNombreImagen(imagenAmpliada)}>
  Descargar
</a>
```

Se creó la clase `.LightboxEnlace--descarga` (color verde) para diferenciarlo visualmente del enlace de visualización.

#### C.3.5 Eliminación de código muerto

La función `SubirImagenesAS3` en `src/services/S3UploadService.js` nunca fue importada ni utilizada en ningún archivo del proyecto. Se eliminó para reducir superficie de código sin funcionalidad.

---

### C.4 Autenticación con AWS Cognito

#### C.4.1 Motivación

La aplicación no tenía ningún control de acceso — cualquier persona con la URL podía subir imágenes al bucket S3. Se implementó autenticación completa con **AWS Cognito** para proteger toda la aplicación.

#### C.4.2 Infraestructura AWS creada

| Recurso | Detalle |
|---------|---------|
| **User Pool** | `us-east-2_bHyMb4xWL` |
| **App Client** | `tqv7m0tkb803r8skou1en4jsa` (Public client, sin secret) |
| **Atributo de login** | Email |
| **Confirmación** | Administrador establece contraseña desde consola |

#### C.4.3 Nuevos archivos creados

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/config/CognitoConfig.js` | Lee `VITE_COGNITO_USER_POOL_ID` y `VITE_COGNITO_CLIENT_ID` del `.env` |
| `src/services/AuthService.js` | `IniciarSesion`, `CompletarNuevaContrasena`, `CerrarSesion`, `ObtenerSesionActual`, `ObtenerToken` |
| `src/hooks/useAuth.js` | Estado reactivo de sesión: `usuario`, `cargando`, `error`, `requiereNuevaContrasena` |
| `src/components/PantallaLogin.jsx` | Formulario de login y formulario de cambio de contraseña (paso 2) |
| `src/components/PantallaLogin.css` | Estilos del login con branding CloudPix (orbes animados, glassmorphism) |

#### C.4.4 Flujo de autenticación

```
App carga
    │
    ├─ Verifica sesión existente (ObtenerSesionActual)
    │       │
    │       ├─ Sesión válida → muestra la app
    │       └─ Sin sesión → muestra PantallaLogin
    │
Usuario ingresa email + contraseña temporal
    │
    ├─ Cognito: credenciales OK → sesión activa → muestra la app
    ├─ Cognito: newPasswordRequired → muestra Paso 2 (nueva contraseña)
    │       └─ Usuario establece contraseña permanente → sesión activa
    └─ Cognito: error → muestra mensaje descriptivo en pantalla
```

#### C.4.5 Token JWT en las peticiones API

Tras el login, el token `IdToken` de Cognito se adjunta automáticamente en cada llamada a API Gateway:

```
Authorization: Bearer <JWT>
```

Esto se realiza en `S3UploadService.js` mediante la función `ObtenerHeaders()` que llama a `ObtenerToken()` antes de cada fetch.

#### C.4.6 Dependencia instalada

```bash
npm install amazon-cognito-identity-js
```

Se requirió agregar `global: 'globalThis'` en `vite.config.js` ya que esta librería usa la variable global `global` de Node.js, que no existe en el navegador.

---

### C.5 Solución CORS con proxy Vite

Las peticiones directas desde el navegador a API Gateway eran bloqueadas por política CORS. Se configuró un **proxy en Vite** que evita el problema sin modificar la configuración de AWS:

```js
// vite.config.js
server: {
  proxy: {
    '/api-gw': {
      target: 'https://jf5qia58x7.execute-api.us-east-1.amazonaws.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api-gw/, ''),
    }
  }
}
```

La variable de entorno se cambió de URL absoluta a ruta relativa:
```
VITE_UPLOAD_API_URL=/api-gw/upload
```

El proxy cubre automáticamente `/api-gw/upload` → `/upload` y `/api-gw/list` → `/list`.

> **Nota:** Este proxy solo aplica en desarrollo local. Para producción se deberá configurar CORS correctamente en API Gateway o usar un dominio propio con certificado.

---

### C.6 Galería S3 completa (POST /list)

#### Situación anterior

La galería solo mostraba imágenes subidas en la sesión actual del navegador (almacenadas en `sessionStorage`). Al cerrar y reabrir el navegador, la galería aparecía vacía.

#### Solución implementada

| Paso | Acción |
|------|--------|
| **API Gateway** | Ruta `POST /list` creada y asociada a la misma Lambda `presigned-url-imagenes` |
| **IAM** | Política inline `ListBucketCloudPix` con permiso `s3:ListBucket` agregada al rol de Lambda |
| **Lambda** | Código actualizado con función `ListarImagenes()` que ejecuta `ListObjectsV2Command` y genera URLs firmadas de lectura para cada objeto |
| **Frontend** | Ya tenía implementado `ListarImagenesDesdeS3()` en `S3UploadService.js` — entró en funcionamiento automáticamente |

#### Flujo de la galería

```
Usuario → "Ver imágenes en S3"
    → POST /api-gw/list (proxy Vite)
    → POST /list (API Gateway)
    → Lambda: ListObjectsV2(bucket, prefix="uploads/")
    → Por cada objeto: getSignedUrl(GetObjectCommand, expiresIn=3600)
    → Respuesta: [{ key, viewUrl, nombre, tamano, fecha }]
    → React: renderiza grid con lazy loading
```

---

### C.7 Variables de entorno actualizadas

```env
# Proxy Vite (desarrollo)
VITE_UPLOAD_API_URL=/api-gw/upload

# AWS Cognito
VITE_COGNITO_USER_POOL_ID=us-east-2_bHyMb4xWL
VITE_COGNITO_CLIENT_ID=tqv7m0tkb803r8skou1en4jsa
```

---

### C.8 Estado funcional tras las mejoras

| Funcionalidad | Estado |
|---------------|--------|
| Login con AWS Cognito | ✅ Operativo |
| Cambio de contraseña temporal (primer acceso) | ✅ Operativo |
| Cerrar sesión | ✅ Operativo |
| Drag & Drop de imágenes | ✅ Operativo |
| Validación de formato (JPG, PNG, WebP) | ✅ Operativo |
| Validación de tamaño (máx. 10 MB) | ✅ Operativo |
| Subida a S3 con barra de progreso | ✅ Operativo |
| Reintentar imágenes fallidas | ✅ Operativo |
| Galería con todas las imágenes del bucket | ✅ Operativo |
| Lightbox con descarga | ✅ Operativo |
| Token JWT en peticiones API | ✅ Operativo |

---

### C.9 Historial de infraestructura AWS — 8 de junio 2026

| Hora | Evento |
|------|--------|
| 15:08 | User Pool `us-east-2_bHyMb4xWL` creado en Cognito |
| 15:09 | App Client `tqv7m0tkb803r8skou1en4jsa` configurado (Public, sin secret) |
| 16:09 | URL de API Gateway corregida a `jf5qia58x7.execute-api.us-east-1.amazonaws.com` |
| 16:32 | Proxy Vite configurado — CORS resuelto |
| 17:52 | Ruta `POST /list` creada en API Gateway con integración `7eju0rb` |
| 18:01 | Política `ListBucketCloudPix` agregada al rol `presigned-url-imagenes-role-y7rfhqww` |
| 18:17 | Lambda actualizada con código de listado — galería muestra 9 imágenes del bucket |
