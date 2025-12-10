import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PreviewPanel } from '@/components/PreviewPanel'
import { api } from '@/lib/api'

// Mock the API client
jest.mock('@/lib/api', () => ({
  api: {
    getPreview: jest.fn(),
    getPreviewFull: jest.fn(),
  },
}))

const mockApi = api as jest.Mocked<typeof api>

describe('PreviewPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders preview panel', () => {
    mockApi.getPreview.mockResolvedValue({ preview: 'test preview' })
    render(<PreviewPanel />)
    expect(screen.getByText('Preview')).toBeInTheDocument()
  })

  it('loads truncated preview on mount', async () => {
    mockApi.getPreview.mockResolvedValue({ preview: 'truncated preview content' })
    render(<PreviewPanel />)
    
    await waitFor(() => {
      expect(mockApi.getPreview).toHaveBeenCalled()
      expect(screen.getByText('truncated preview content')).toBeInTheDocument()
    })
  })

  it('displays loading state', () => {
    mockApi.getPreview.mockImplementation(() => new Promise(() => {})) // Never resolves
    render(<PreviewPanel />)
    expect(screen.getByText('Loading preview...')).toBeInTheDocument()
  })

  it('displays no content message when preview is empty', async () => {
    mockApi.getPreview.mockResolvedValue({ preview: '' })
    render(<PreviewPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('No content to preview')).toBeInTheDocument()
    })
  })

  it('expands to full preview', async () => {
    const user = userEvent.setup()
    mockApi.getPreview.mockResolvedValue({ preview: 'truncated' })
    mockApi.getPreviewFull.mockResolvedValue({ preview: 'full preview content' })
    
    render(<PreviewPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('truncated')).toBeInTheDocument()
    })
    
    const expandButton = screen.getByRole('button', { name: /expand/i })
    await user.click(expandButton)
    
    await waitFor(() => {
      expect(mockApi.getPreviewFull).toHaveBeenCalled()
      expect(screen.getByText('full preview content')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /collapse/i })).toBeInTheDocument()
    })
  })

  it('collapses to truncated preview', async () => {
    const user = userEvent.setup()
    mockApi.getPreview.mockResolvedValue({ preview: 'truncated preview' })
    mockApi.getPreviewFull.mockResolvedValue({ preview: 'full preview' })
    
    render(<PreviewPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('truncated preview')).toBeInTheDocument()
    })
    
    // Expand first
    const expandButton = screen.getByRole('button', { name: /expand/i })
    await user.click(expandButton)
    
    await waitFor(() => {
      expect(screen.getByText('full preview')).toBeInTheDocument()
    })
    
    // Then collapse
    const collapseButton = screen.getByRole('button', { name: /collapse/i })
    await user.click(collapseButton)
    
    await waitFor(() => {
      expect(mockApi.getPreview).toHaveBeenCalledTimes(2) // Initial + collapse
      expect(screen.getByText('truncated preview')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    mockApi.getPreview.mockRejectedValue(new Error('API error'))
    
    render(<PreviewPanel />)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load preview:', expect.any(Error))
      expect(screen.getByText('Failed to load preview')).toBeInTheDocument()
    })
    
    consoleSpy.mockRestore()
  })

  it('disables toggle button while loading', async () => {
    mockApi.getPreview.mockResolvedValue({ preview: 'test' })
    mockApi.getPreviewFull.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<PreviewPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument()
    })
    
    const expandButton = screen.getByRole('button', { name: /expand/i })
    await userEvent.click(expandButton)
    
    await waitFor(() => {
      expect(expandButton).toBeDisabled()
    })
  })
})

