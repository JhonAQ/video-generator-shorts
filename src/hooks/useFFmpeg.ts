import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { useEffect, useRef, useState } from 'react'

export interface VideoConfig {
  images: File[]
  audioNarration: File
  selectedSoundtrack?: string
  selectedFilter?: string
  thumbnail?: File
}

export interface ProcessingProgress {
  phase: 'loading' | 'preparing' | 'processing' | 'finalizing' | 'completed' | 'error'
  progress: number
  message: string
}

export const useFFmpeg = () => {
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (ffmpegRef.current?.loaded || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd'
      const ffmpeg = new FFmpeg()

      ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg:', message)
      })

      // Load FFmpeg
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })

      ffmpegRef.current = ffmpeg
      setIsLoaded(true)
    } catch (err) {
      console.error('Error loading FFmpeg:', err)
      setError('Error al cargar el procesador de video')
    } finally {
      setIsLoading(false)
    }
  }

  const createVideo = async (
    config: VideoConfig,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<Blob | null> => {
    if (!ffmpegRef.current?.loaded) {
      throw new Error('FFmpeg no está cargado')
    }

    const ffmpeg = ffmpegRef.current

    try {
      onProgress?.({
        phase: 'preparing',
        progress: 0,
        message: 'Preparando archivos...'
      })

      // Write images to FFmpeg filesystem
      for (let i = 0; i < config.images.length; i++) {
        const fileName = `image${String(i).padStart(3, '0')}.jpg`
        await ffmpeg.writeFile(fileName, await fetchFile(config.images[i]))
        
        onProgress?.({
          phase: 'preparing',
          progress: (i / config.images.length) * 30,
          message: `Cargando imagen ${i + 1}/${config.images.length}...`
        })
      }

      // Write audio narration
      await ffmpeg.writeFile('narration.mp3', await fetchFile(config.audioNarration))

      onProgress?.({
        phase: 'preparing',
        progress: 40,
        message: 'Audio de narración cargado...'
      })

      // Write soundtrack if selected
      if (config.selectedSoundtrack) {
        try {
          const soundtrackResponse = await fetch(config.selectedSoundtrack)
          const soundtrackBlob = await soundtrackResponse.blob()
          await ffmpeg.writeFile('soundtrack.mp3', await fetchFile(soundtrackBlob))
          
          onProgress?.({
            phase: 'preparing',
            progress: 50,
            message: 'Soundtrack cargado...'
          })
        } catch (err) {
          console.warn('Error loading soundtrack, proceeding without it:', err)
        }
      }

      // Write thumbnail if provided
      if (config.thumbnail) {
        await ffmpeg.writeFile('thumbnail.jpg', await fetchFile(config.thumbnail))
        
        onProgress?.({
          phase: 'preparing',
          progress: 60,
          message: 'Miniatura cargada...'
        })
      }

      onProgress?.({
        phase: 'processing',
        progress: 65,
        message: 'Creando video de imágenes...'
      })

      // Create image slideshow (2 seconds per image)
      await ffmpeg.exec([
        '-framerate', '0.5', // 0.5 fps = 2 seconds per frame
        '-i', 'image%03d.jpg',
        '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,fps=30',
        '-pix_fmt', 'yuv420p',
        '-t', '60', // 60 seconds
        'slideshow.mp4'
      ])

      onProgress?.({
        phase: 'processing',
        progress: 75,
        message: 'Sincronizando audio...'
      })

      let finalVideoCommand = []
      let inputs = ['-i', 'slideshow.mp4', '-i', 'narration.mp3']
      let filterComplex = '[0:v]'
      let audioMix = '[1:a]'

      // Add soundtrack if available
      if (config.selectedSoundtrack) {
        inputs.push('-i', 'soundtrack.mp3')
        // Mix narration and soundtrack (narration at full volume, soundtrack at 30%)
        audioMix = '[1:a][2:a]amix=inputs=2:weights=1.0 0.3[mixed]'
        filterComplex += ';' + audioMix
      }

      // Add thumbnail if provided
      if (config.thumbnail) {
        filterComplex = `[0:v]fade=in:0:6[main];movie=thumbnail.jpg,scale=1920:1080,fade=out:0:6[thumb];[thumb][main]concat=n=2:v=1:a=0[withThumb];[withThumb]`
      }

      // Add fade out
      filterComplex += 'fade=out:1770:45[fadeout]'

      finalVideoCommand = [
        ...inputs,
        '-filter_complex', filterComplex,
        '-map', '[fadeout]',
        '-map', config.selectedSoundtrack ? '[mixed]' : '[1:a]',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-shortest',
        'final_video.mp4'
      ]

      await ffmpeg.exec(finalVideoCommand)

      onProgress?.({
        phase: 'finalizing',
        progress: 95,
        message: 'Finalizando video...'
      })

      // Read the output
      const data = await ffmpeg.readFile('final_video.mp4')
      const blob = new Blob([data as unknown as ArrayBuffer], { type: 'video/mp4' })

      onProgress?.({
        phase: 'completed',
        progress: 100,
        message: '¡Video completado!'
      })

      // Clean up files
      const filesToClean = [
        'slideshow.mp4',
        'final_video.mp4',
        'narration.mp3',
        'soundtrack.mp3',
        'thumbnail.jpg',
        ...config.images.map((_, i) => `image${String(i).padStart(3, '0')}.jpg`)
      ]

      for (const file of filesToClean) {
        try {
          await ffmpeg.deleteFile(file)
        } catch (err) {
          // Ignore cleanup errors
        }
      }

      return blob
    } catch (err) {
      console.error('Error creating video:', err)
      onProgress?.({
        phase: 'error',
        progress: 0,
        message: 'Error al procesar el video'
      })
      throw err
    }
  }

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (ffmpegRef.current) {
        ffmpegRef.current = null
      }
    }
  }, [])

  return {
    load,
    createVideo,
    isLoaded,
    isLoading,
    error
  }
}
