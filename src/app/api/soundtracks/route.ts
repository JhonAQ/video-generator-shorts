import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'public', 'assets', 'soundtracks.json')
    const fileContent = await readFile(filePath, 'utf-8')
    const soundtracks = JSON.parse(fileContent)
    
    return NextResponse.json(soundtracks)
  } catch (error) {
    console.error('Error loading soundtracks:', error)
    return NextResponse.json(
      { error: 'Failed to load soundtracks' },
      { status: 500 }
    )
  }
}
