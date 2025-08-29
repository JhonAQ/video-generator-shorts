import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export const runtime = 'nodejs'
export const preferredRegion = 'auto'

// Interface for the request body
interface GenerateVideoRequest {
  images: File[]
  audioNarration: File
  selectedSoundtrack?: string
  selectedFilter?: string
  thumbnail?: File
  projectName: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting video generation process...')

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads')
    const projectId = `project_${Date.now()}`
    const projectDir = join(uploadsDir, projectId)
    
    try {
      await mkdir(projectDir, { recursive: true })
      await mkdir(join(projectDir, 'images'), { recursive: true })
      await mkdir(join(projectDir, 'audio'), { recursive: true })
      await mkdir(join(projectDir, 'output'), { recursive: true })
    } catch (error) {
      console.error('Error creating directories:', error)
    }

    // Get form data
    const formData = await request.formData()
    
    // Extract data from form
    const projectName = formData.get('projectName') as string || 'Untitled Project'
    const selectedSoundtrack = formData.get('selectedSoundtrack') as string
    const selectedFilter = formData.get('selectedFilter') as string
    
    // Process images
    const images: File[] = []
    let imageIndex = 0
    while (formData.has(`image_${imageIndex}`)) {
      const imageFile = formData.get(`image_${imageIndex}`) as File
      if (imageFile && imageFile.size > 0) {
        images.push(imageFile)
        
        // Save image to project directory
        const bytes = await imageFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const imagePath = join(projectDir, 'images', `${imageIndex.toString().padStart(2, '0')}_${imageFile.name}`)
        await writeFile(imagePath, buffer)
      }
      imageIndex++
    }

    // Process audio narration
    const audioNarration = formData.get('audioNarration') as File
    let audioPath = ''
    if (audioNarration && audioNarration.size > 0) {
      const bytes = await audioNarration.arrayBuffer()
      const buffer = Buffer.from(bytes)
      audioPath = join(projectDir, 'audio', `narration_${audioNarration.name}`)
      await writeFile(audioPath, buffer)
    }

    // Process thumbnail if provided
    const thumbnail = formData.get('thumbnail') as File
    let thumbnailPath = ''
    if (thumbnail && thumbnail.size > 0) {
      const bytes = await thumbnail.arrayBuffer()
      const buffer = Buffer.from(bytes)
      thumbnailPath = join(projectDir, 'images', `thumbnail_${thumbnail.name}`)
      await writeFile(thumbnailPath, buffer)
    }

    // Validate requirements
    if (images.length !== 30) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Se requieren exactamente 30 imágenes. Recibidas: ${images.length}` 
        },
        { status: 400 }
      )
    }

    if (!audioNarration || audioNarration.size === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Se requiere un archivo de audio para la narración' 
        },
        { status: 400 }
      )
    }

    console.log(`✅ Files validated: ${images.length} images, audio: ${audioNarration.name}`)

    // Create project configuration
    const projectConfig = {
      id: projectId,
      name: projectName,
      createdAt: new Date().toISOString(),
      images: images.map((img, index) => ({
        filename: `${index.toString().padStart(2, '0')}_${img.name}`,
        originalName: img.name,
        size: img.size,
        order: index
      })),
      audio: {
        narration: {
          filename: `narration_${audioNarration.name}`,
          originalName: audioNarration.name,
          size: audioNarration.size
        }
      },
      selectedSoundtrack,
      selectedFilter,
      thumbnail: thumbnail ? {
        filename: `thumbnail_${thumbnail.name}`,
        originalName: thumbnail.name,
        size: thumbnail.size
      } : null,
      status: 'processing'
    }

    // Save project configuration
    const configPath = join(projectDir, 'config.json')
    await writeFile(configPath, JSON.stringify(projectConfig, null, 2))

    // TODO: Here we would call the Python worker to process the video
    // For now, we'll simulate the process
    console.log('🎬 Starting video processing simulation...')

    // Simulate processing time
    setTimeout(async () => {
      console.log('✨ Video processing completed (simulated)')
      
      // Update project status
      projectConfig.status = 'completed'
      await writeFile(configPath, JSON.stringify(projectConfig, null, 2))
    }, 10000) // 10 seconds simulation

    return NextResponse.json({
      success: true,
      message: 'Generación de video iniciada',
      projectId,
      projectConfig,
      estimatedTime: '2-3 minutos'
    })

  } catch (error) {
    console.error('❌ Error generating video:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor durante la generación del video',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// Status check endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const projectDir = join(process.cwd(), 'uploads', projectId)
    const configPath = join(projectDir, 'config.json')

    try {
      const { readFile } = await import('fs/promises')
      const configData = await readFile(configPath, 'utf-8')
      const projectConfig = JSON.parse(configData)

      return NextResponse.json({
        success: true,
        projectConfig
      })
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Error checking project status:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
