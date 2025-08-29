import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'public', 'assets', 'filters.json')
    const fileContent = await readFile(filePath, 'utf-8')
    const filters = JSON.parse(fileContent)
    
    return NextResponse.json(filters)
  } catch (error) {
    console.error('Error loading filters:', error)
    return NextResponse.json(
      { error: 'Failed to load filters' },
      { status: 500 }
    )
  }
}
