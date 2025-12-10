import { render, screen, waitFor } from '@testing-library/react'
import { FavoritesPanel } from '@/components/FavoritesPanel'
import { api } from '@/lib/api'

// Mock the API client
jest.mock('@/lib/api')

const mockApi = api as jest.Mocked<typeof api>

describe('FavoritesPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders favorites panel', () => {
    mockApi.getConfig.mockResolvedValue({ favorites: [] })
    render(<FavoritesPanel />)
    expect(screen.getByText('Favorites')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    mockApi.getConfig.mockImplementation(() => new Promise(() => {})) // Never resolves
    render(<FavoritesPanel />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays no favorites message when empty', async () => {
    mockApi.getConfig.mockResolvedValue({ favorites: [] })
    render(<FavoritesPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('No favorites configured')).toBeInTheDocument()
    })
  })

  it('displays favorites list', async () => {
    const mockFavorites = [
      { label: 'Project A', path: '/path/to/project-a' },
      { label: 'Project B', path: '/path/to/project-b' },
    ]
    mockApi.getConfig.mockResolvedValue({ favorites: mockFavorites })
    render(<FavoritesPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('Project A')).toBeInTheDocument()
      expect(screen.getByText('Project B')).toBeInTheDocument()
      expect(screen.getByText('/path/to/project-a')).toBeInTheDocument()
      expect(screen.getByText('/path/to/project-b')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    mockApi.getConfig.mockRejectedValue(new Error('Failed to load config'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    render(<FavoritesPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('No favorites configured')).toBeInTheDocument()
    })
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load favorites:', expect.any(Error))
    consoleSpy.mockRestore()
  })
})

