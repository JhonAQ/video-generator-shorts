import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface VideoProject {
  id: string
  name: string
  images: File[]
  audioNarration?: File
  selectedSoundtrack?: string
  selectedFilter?: string
  thumbnail?: File
  status: 'draft' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
  createdAt: Date
  progress?: number
}

export interface Soundtrack {
  id: string
  name: string
  file: string
  duration?: number
  genre?: string
}

export interface Filter {
  id: string
  name: string
  file: string
  preview?: string
  description?: string
}

interface VideoStore {
  // Current project being edited
  currentProject: Partial<VideoProject>
  
  // Available assets
  soundtracks: Soundtrack[]
  filters: Filter[]
  
  // Projects history
  projects: VideoProject[]
  
  // UI state
  isProcessing: boolean
  processingProgress: number
  
  // Actions
  updateCurrentProject: (updates: Partial<VideoProject>) => void
  addImages: (images: File[]) => void
  setAudioNarration: (audio: File | undefined) => void
  setThumbnail: (thumbnail: File | undefined) => void
  selectSoundtrack: (soundtrackId: string) => void
  selectFilter: (filterId: string) => void
  
  // Project management
  saveProject: () => void
  loadProject: (projectId: string) => void
  deleteProject: (projectId: string) => void
  
  // Processing
  startProcessing: () => void
  updateProgress: (progress: number) => void
  completeProcessing: (videoUrl: string) => void
  failProcessing: (error: string) => void
  
  // Asset management
  loadSoundtracks: () => Promise<void>
  loadFilters: () => Promise<void>
  
  // Reset
  resetCurrentProject: () => void
}

const useVideoStore = create<VideoStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentProject: {
        id: crypto.randomUUID(),
        name: `Video ${new Date().toLocaleDateString()}`,
        images: [],
        status: 'draft',
        createdAt: new Date()
      },
      
      soundtracks: [],
      filters: [],
      projects: [],
      isProcessing: false,
      processingProgress: 0,

      // Actions
      updateCurrentProject: (updates) =>
        set((state) => ({
          currentProject: { ...state.currentProject, ...updates }
        })),

      addImages: (images) =>
        set((state) => ({
          currentProject: {
            ...state.currentProject,
            images: [...(state.currentProject.images || []), ...images]
          }
        })),

      setAudioNarration: (audio) =>
        set((state) => ({
          currentProject: { ...state.currentProject, audioNarration: audio }
        })),

      setThumbnail: (thumbnail) =>
        set((state) => ({
          currentProject: { ...state.currentProject, thumbnail }
        })),

      selectSoundtrack: (soundtrackId) =>
        set((state) => ({
          currentProject: { ...state.currentProject, selectedSoundtrack: soundtrackId }
        })),

      selectFilter: (filterId) =>
        set((state) => ({
          currentProject: { ...state.currentProject, selectedFilter: filterId }
        })),

      // Project management
      saveProject: () => {
        const { currentProject, projects } = get()
        if (currentProject.images && currentProject.images.length === 30) {
          const newProject: VideoProject = {
            ...currentProject,
            id: currentProject.id || crypto.randomUUID(),
            name: currentProject.name || `Video ${new Date().toLocaleDateString()}`,
            images: currentProject.images,
            status: currentProject.status || 'draft',
            createdAt: currentProject.createdAt || new Date()
          } as VideoProject

          const existingIndex = projects.findIndex(p => p.id === newProject.id)
          const updatedProjects = existingIndex >= 0 
            ? [...projects.slice(0, existingIndex), newProject, ...projects.slice(existingIndex + 1)]
            : [...projects, newProject]

          set({ projects: updatedProjects })
        }
      },

      loadProject: (projectId) => {
        const project = get().projects.find(p => p.id === projectId)
        if (project) {
          set({ currentProject: { ...project } })
        }
      },

      deleteProject: (projectId) =>
        set((state) => ({
          projects: state.projects.filter(p => p.id !== projectId)
        })),

      // Processing
      startProcessing: () =>
        set({ isProcessing: true, processingProgress: 0 }),

      updateProgress: (progress) =>
        set({ processingProgress: progress }),

      completeProcessing: (videoUrl) =>
        set((state) => ({
          isProcessing: false,
          processingProgress: 100,
          currentProject: { ...state.currentProject, videoUrl, status: 'completed' }
        })),

      failProcessing: (error) =>
        set((state) => ({
          isProcessing: false,
          processingProgress: 0,
          currentProject: { ...state.currentProject, status: 'failed' }
        })),

      // Asset management
      loadSoundtracks: async () => {
        try {
          const response = await fetch('/api/soundtracks')
          const soundtracks = await response.json()
          set({ soundtracks })
        } catch (error) {
          console.error('Error loading soundtracks:', error)
        }
      },

      loadFilters: async () => {
        try {
          const response = await fetch('/api/filters')
          const filters = await response.json()
          set({ filters })
        } catch (error) {
          console.error('Error loading filters:', error)
        }
      },

      // Reset
      resetCurrentProject: () =>
        set({
          currentProject: {
            id: crypto.randomUUID(),
            name: `Video ${new Date().toLocaleDateString()}`,
            images: [],
            status: 'draft',
            createdAt: new Date()
          }
        })
    }),
    {
      name: 'video-store'
    }
  )
)

export default useVideoStore
