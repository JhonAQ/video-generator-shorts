# VideoGen Pro 🎬

**Generador de Videos Profesional** - Una plataforma web moderna y disruptiva para crear videos de 60 segundos con imágenes, audio y efectos visuales.

![VideoGen Pro](https://img.shields.io/badge/VideoGen-Pro-blue) ![Next.js](https://img.shields.io/badge/Next.js-15.5-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Python](https://img.shields.io/badge/Python-3.8+-green)

## ✨ Características

- **📸 30 Imágenes**: Carga exactamente 30 imágenes para crear un video de 60 segundos (2s por imagen)
- **🎤 Audio de Narración**: Sube tu archivo de audio principal
- **🎵 Soundtrack de Fondo**: Selecciona entre varios soundtracks predefinidos
- **✨ Efectos Visuales**: Aplica filtros con chroma key sobre el video
- **🖼️ Miniatura de Intro**: Imagen opcional que se muestra 0.2s al inicio
- **🌅 Fade-out Automático**: Transición suave de 1.5s al final
- **🎯 Interfaz Profesional**: Diseño minimalista y disruptivo

## 🏗️ Arquitectura

### Frontend (Next.js + TypeScript)

- **Framework**: Next.js 15.5 con App Router
- **Estilos**: Tailwind CSS 4.0
- **Estado**: Zustand para manejo de estado global
- **Animaciones**: Framer Motion
- **UI Components**: Radix UI + Lucide Icons

### Backend (API Routes + Python Worker)

- **API**: Next.js API Routes para control de procesos
- **Worker**: Script Python para procesamiento de video
- **Almacenamiento**: Sistema de archivos local (escalable a S3)
- **Procesamiento**: FFmpeg para ensamblado de video

### Stack Tecnológico

```
Frontend:  Next.js + TypeScript + Tailwind + Zustand + Framer Motion
Backend:   Node.js + Python + FFmpeg
Database:  File System (JSON configs)
Storage:   Local uploads/ directory
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Node.js** 18+
- **Python** 3.8+
- **FFmpeg** (con FFprobe)

### 1. Clonar e instalar dependencias

```bash
git clone <repository-url>
cd video-generator-shorts

# Instalar dependencias de Node.js
npm install
```

### 2. Configurar el Worker de Python

```bash
# Navegar al directorio del worker
cd video-worker

# Ejecutar setup (instala dependencias y valida FFmpeg)
python setup.py
```

### 3. Crear directorios y assets

```bash
# Crear estructura de directorios
mkdir -p public/sounds public/filters public/filters/previews uploads

# Agregar tus soundtracks a public/sounds/
# Agregar tus filtros (videos con fondo verde) a public/filters/
# Agregar previews de filtros a public/filters/previews/
```

### 4. Configurar assets predefinidos

El sistema usa archivos JSON para configurar soundtracks y filtros:

**Soundtracks** (`public/assets/soundtracks.json`):

```json
[
  {
    "id": "epic-cinematic",
    "name": "Epic Cinematic",
    "file": "/sounds/epic-cinematic.mp3",
    "duration": 120,
    "genre": "Epic"
  }
]
```

**Filtros** (`public/assets/filters.json`):

```json
[
  {
    "id": "glitch-overlay",
    "name": "Glitch Overlay",
    "file": "/filters/glitch-overlay.mp4",
    "preview": "/filters/previews/glitch-overlay.jpg",
    "description": "Efectos de glitch digital moderno"
  }
]
```

### 5. Ejecutar el proyecto

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📋 Flujo de Usuario

### Proceso de Creación de Video (6 pasos):

1. **📸 Imágenes**: Carga exactamente 30 imágenes (drag & drop, reordenable)
2. **🎤 Audio**: Sube el archivo de audio de narración (MP3, WAV, etc.)
3. **🎵 Soundtrack**: Selecciona música de fondo del catálogo
4. **✨ Efectos**: Elige filtros visuales con chroma key (opcional)
5. **🖼️ Miniatura**: Sube imagen de introducción (opcional)
6. **🎬 Generar**: Procesa todo y genera el video final

### Especificaciones Técnicas del Video:

- **Duración**: 60 segundos + 1.5s fade-out
- **Resolución**: 1920x1080 (Full HD)
- **FPS**: 30fps
- **Formato**: MP4 (H.264 + AAC)
- **Cada imagen**: 2 segundos exactos
- **Miniatura**: 0.2 segundos al inicio
- **Audio**: Narración principal + soundtrack de fondo (volumen balanceado)

## 🔧 Configuración de Development

### Scripts disponibles:

```bash
npm run dev          # Modo desarrollo con Turbopack
npm run build        # Build de producción
npm run start        # Servidor de producción
```

### Estructura del proyecto:

```
video-generator-shorts/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API Routes
│   │   ├── globals.css     # Estilos globales
│   │   ├── layout.tsx      # Layout principal
│   │   └── page.tsx        # Página principal
│   ├── components/         # Componentes React
│   │   ├── ImageUploader.tsx
│   │   ├── AudioUploader.tsx
│   │   ├── SoundtrackSelector.tsx
│   │   ├── FilterSelector.tsx
│   │   ├── ThumbnailUploader.tsx
│   │   └── VideoProcessor.tsx
│   ├── store/              # Zustand stores
│   │   └── useVideoStore.ts
│   └── lib/                # Utilidades
├── public/
│   ├── assets/             # Configuraciones JSON
│   ├── sounds/             # Archivos de soundtrack
│   ├── filters/            # Videos de filtros
│   └── filters/previews/   # Previews de filtros
├── video-worker/           # Worker Python
│   ├── video_processor.py  # Procesador principal
│   ├── setup.py           # Script de configuración
│   └── requirements.txt    # Dependencias Python
├── uploads/                # Directorio de proyectos
└── package.json
```

## 🎨 Diseño y UX

### Principios de Diseño:

- **Minimalismo Disruptivo**: Interfaz limpia sin elementos innecesarios
- **Profesional**: Como un editor de video de alta gama
- **Progresivo**: Flujo paso a paso guiado
- **Responsive**: Funciona en desktop y tablet
- **Dark Theme**: Tema oscuro profesional
- **Micro-interacciones**: Animaciones fluidas con Framer Motion

### Paleta de Colores:

- **Backgrounds**: Grises oscuros (#0a0a0a, #1a1a1a, #374151)
- **Accent**: Azul (#3b82f6) y Púrpura (#8b5cf6)
- **Success**: Verde (#10b981)
- **Warning**: Amarillo/Naranja (#f59e0b)
- **Error**: Rojo (#ef4444)

## 🔄 API Endpoints

### `POST /api/generate`

Inicia la generación de video

```typescript
Body: FormData {
  projectName: string
  image_0 to image_29: File[]
  audioNarration: File
  selectedSoundtrack?: string
  selectedFilter?: string
  thumbnail?: File
}

Response: {
  success: boolean
  projectId: string
  estimatedTime: string
}
```

### `GET /api/generate?projectId=xxx`

Consulta estado del proyecto

```typescript
Response: {
  success: boolean
  projectConfig: {
    status: 'processing' | 'completed' | 'error'
    progress: number
    message?: string
    outputFile?: string
  }
}
```

### `GET /api/soundtracks`

Lista soundtracks disponibles

### `GET /api/filters`

Lista filtros disponibles

## 🐍 Worker de Python

### Funcionalidades del Worker:

1. **Validación**: Verifica archivos y requisitos
2. **Procesamiento de Imágenes**: Redimensiona a 1920x1080
3. **Procesamiento de Audio**: Normaliza y prepara pistas
4. **Timeline**: Crea secuencia de 30 imágenes (2s c/u)
5. **Miniatura**: Agrega intro de 0.2s si se proporciona
6. **Mezcla de Audio**: Combina narración + soundtrack
7. **Efectos**: Aplica filtros con chroma key
8. **Fade-out**: Agrega transición de 1.5s al final
9. **Export**: Genera MP4 final optimizado

### Comandos FFmpeg utilizados:

- Redimensión y crop de imágenes
- Creación de timeline con concat
- Chroma key para filtros
- Mezcla de audio (amix)
- Fade-in/out de video y audio
- Encoding H.264 + AAC

## 📈 Escalabilidad y Producción

### Para producción se recomienda:

1. **Base de datos**: PostgreSQL o MongoDB para proyectos
2. **Storage**: AWS S3 o Google Cloud Storage
3. **Queue**: Redis + Bull para procesamientos asincrónicos
4. **Worker**: Servicio separado (Docker + Kubernetes)
5. **CDN**: CloudFront para assets estáticos
6. **Monitoring**: Sentry para errores, Prometheus para métricas

### Variables de entorno sugeridas:

```env
DATABASE_URL=postgresql://...
AWS_S3_BUCKET=video-gen-pro
REDIS_URL=redis://...
WORKER_CONCURRENCY=3
MAX_VIDEO_DURATION=65
```

## 🤝 Contribución

1. Fork del repositorio
2. Crear branch feature (`git checkout -b feature/nueva-feature`)
3. Commit cambios (`git commit -am 'Agregar nueva feature'`)
4. Push al branch (`git push origin feature/nueva-feature`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**VideoGen Pro** - Generador de Videos Profesional 🎬✨
