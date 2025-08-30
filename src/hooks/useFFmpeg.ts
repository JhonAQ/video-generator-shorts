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
        progress: 10,
        message: 'Preparando archivos...'
      })

      // Clear any existing files in FFmpeg filesystem
      try {
        const files = await ffmpeg.listDir('/')
        for (const file of files) {
          if (file.name && !file.name.startsWith('.')) {
            try {
              await ffmpeg.deleteFile(file.name)
            } catch {
              // Ignore individual file deletion errors
            }
          }
        }
      } catch (err) {
        // Ignore errors when clearing files
      }

      // Write images to FFmpeg filesystem with proper naming
      console.log(`Writing ${config.images.length} images...`)
      for (let i = 0; i < config.images.length; i++) {
        const fileName = `image${String(i).padStart(3, '0')}.png`
        console.log(`Writing ${fileName}`)
        await ffmpeg.writeFile(fileName, await fetchFile(config.images[i]))
      }

      onProgress?.({
        phase: 'preparing',
        progress: 40,
        message: 'Imágenes cargadas, preparando audio...'
      })

      // Write audio narration
      await ffmpeg.writeFile('narration.mp3', await fetchFile(config.audioNarration))

      // Write soundtrack if selected
      let hasSoundtrack = false
      if (config.selectedSoundtrack) {
        console.log('Loading soundtrack:', config.selectedSoundtrack)
        try {
          const soundtrackResponse = await fetch(config.selectedSoundtrack)
          console.log('Soundtrack response status:', soundtrackResponse.status)
          if (soundtrackResponse.ok) {
            const soundtrackBlob = await soundtrackResponse.blob()
            console.log('Soundtrack blob size:', soundtrackBlob.size)
            await ffmpeg.writeFile('soundtrack.mp3', await fetchFile(soundtrackBlob))
            hasSoundtrack = true
            console.log('Soundtrack loaded successfully')
          } else {
            console.warn('Soundtrack response not ok:', soundtrackResponse.statusText)
          }
        } catch (err) {
          console.warn('Could not load soundtrack:', err)
        }
      } else {
        console.log('No soundtrack selected')
      }

      onProgress?.({
        phase: 'processing',
        progress: 50,
        message: 'Creando slideshow base...'
      })

      // Create slideshow video from images (2 seconds per image, 30 images = 60 seconds)
      await ffmpeg.exec([
        '-framerate', '0.5', // 0.5 fps = 2 seconds per frame
        '-i', 'image%03d.png',
        '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:-1:-1:black',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-t', '60', // 60 seconds total
        'slideshow_base.mp4'
      ])

      onProgress?.({
        phase: 'processing',
        progress: 60,
        message: 'Extendiendo video con fade-out...'
      })

      // Extend the video by 1.5 seconds and add fade-out
      await ffmpeg.exec([
        '-i', 'slideshow_base.mp4',
        '-vf', 'fade=t=out:st=60:d=1.5',
        '-t', '61.5', // Extend to 61.5 seconds
        'slideshow.mp4'
      ])

      onProgress?.({
        phase: 'processing',
        progress: 80,
        message: 'Procesando audio con loop y fade-out...'
      })

      // Mix audio: narration + soundtrack (if available)
      if (hasSoundtrack) {
        console.log('Mixing narration with soundtrack...')
        
        // First, create a longer soundtrack by looping it
        await ffmpeg.exec([
          '-stream_loop', '10', // Loop soundtrack 10 times to ensure it's long enough
          '-i', 'soundtrack.mp3',
          '-t', '70', // Make it 70 seconds to be safe
          'soundtrack_long.mp3'
        ])

        // Then mix narration with the long soundtrack
        await ffmpeg.exec([
          '-i', 'narration.mp3',
          '-i', 'soundtrack_long.mp3',
          '-filter_complex', '[1:a]volume=0.3[bg];[0:a][bg]amix=inputs=2:duration=longest',
          '-t', '61.5', // 60s + 1.5s fade
          'mixed_base.aac'
        ])

        // Add fade-out to the mixed audio
        await ffmpeg.exec([
          '-i', 'mixed_base.aac',
          '-af', 'afade=t=out:st=60:d=1.5',
          'mixed_audio.aac'
        ])

        console.log('Adding mixed audio to video...')
        // Then combine with video
        await ffmpeg.exec([
          '-i', 'slideshow.mp4',
          '-i', 'mixed_audio.aac',
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-shortest',
          'final.mp4'
        ])
      } else {
        console.log('Adding narration only to video...')
        
        // Extend narration audio to match video duration
        await ffmpeg.exec([
          '-i', 'narration.mp3',
          '-af', 'apad=pad_dur=1.5,afade=t=out:st=60:d=1.5',
          'narration_extended.aac'
        ])

        // Combine with video
        await ffmpeg.exec([
          '-i', 'slideshow.mp4',
          '-i', 'narration_extended.aac',
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-shortest',
          'final.mp4'
        ])
      }

      onProgress?.({
        phase: 'finalizing',
        progress: 90,
        message: 'Finalizando video...'
      })

      // Read the output file
      const data = await ffmpeg.readFile('final.mp4')
      // Convert to standard Uint8Array for Blob
      const videoData = new Uint8Array(data as Uint8Array)
      const blob = new Blob([videoData], { type: 'video/mp4' })

      onProgress?.({
        phase: 'completed',
        progress: 100,
        message: 'Video generado exitosamente!'
      })

      return blob
    } catch (err) {
      console.error('Error creating video:', err)
      onProgress?.({
        phase: 'error',
        progress: 0,
        message: 'Error al crear el video'
      })
      throw err
    }
  }

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (ffmpegRef.current) {
        try {
          ffmpegRef.current.terminate()
        } catch (err) {
          console.warn('Error terminating FFmpeg:', err)
        }
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
