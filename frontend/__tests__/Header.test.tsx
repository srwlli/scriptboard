import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from '@/components/Header'
import { api } from '@/lib/api'

// Mock the API client
jest.mock('@/lib/api', () => ({
  api: {
    search: jest.fn(),
  },
}))

// Mock ThemeToggle
jest.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}))

// Mock SearchResults
jest.mock('@/components/SearchResults', () => ({
  SearchResults: ({ query, onClose }: { query: string; onClose: () => void }) => (
    <div data-testid="search-results">
      <p>Results for: {query}</p>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

const mockApi = api as jest.Mocked<typeof api>

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders header with title', () => {
    render(<Header />)
    expect(screen.getByText('Scriptboard')).toBeInTheDocument()
  })

  it('renders theme toggle', () => {
    render(<Header />)
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<Header />)
    const searchInput = screen.getByPlaceholderText(/search prompts, attachments, responses/i)
    expect(searchInput).toBeInTheDocument()
  })

  it('updates search query on input change', async () => {
    const user = userEvent.setup()
    render(<Header />)
    
    const searchInput = screen.getByPlaceholderText(/search prompts, attachments, responses/i) as HTMLInputElement
    await user.type(searchInput, 'test query')
    
    expect(searchInput.value).toBe('test query')
  })

  it('performs search on form submit', async () => {
    const user = userEvent.setup()
    const mockResults = {
      results: [{ type: 'prompt', content: 'test', snippet: 'test snippet' }],
      total: 1,
    }
    mockApi.search.mockResolvedValue(mockResults)
    
    render(<Header />)
    
    const searchInput = screen.getByPlaceholderText(/search prompts, attachments, responses/i)
    await user.type(searchInput, 'test')
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(mockApi.search).toHaveBeenCalledWith('test')
      expect(screen.getByTestId('search-results')).toBeInTheDocument()
    })
  })

  it('shows loading state while searching', async () => {
    const user = userEvent.setup()
    mockApi.search.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<Header />)
    
    const searchInput = screen.getByPlaceholderText(/search prompts, attachments, responses/i)
    await user.type(searchInput, 'test')
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(screen.getByText('Searching...')).toBeInTheDocument()
      const input = screen.getByPlaceholderText(/search prompts, attachments, responses/i) as HTMLInputElement
      expect(input).toBeDisabled()
    })
  })

  it('hides results when query is empty', async () => {
    const user = userEvent.setup()
    const mockResults = {
      results: [{ type: 'prompt', content: 'test', snippet: 'test snippet' }],
      total: 1,
    }
    mockApi.search.mockResolvedValue(mockResults)
    
    render(<Header />)
    
    const searchInput = screen.getByPlaceholderText(/search prompts, attachments, responses/i)
    
    // Search with query
    await user.type(searchInput, 'test')
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(screen.getByTestId('search-results')).toBeInTheDocument()
    })
    
    // Clear query
    await user.clear(searchInput)
    
    await waitFor(() => {
      expect(screen.queryByTestId('search-results')).not.toBeInTheDocument()
    })
  })

  it('handles search errors gracefully', async () => {
    const user = userEvent.setup()
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    mockApi.search.mockRejectedValue(new Error('Search failed'))
    
    render(<Header />)
    
    const searchInput = screen.getByPlaceholderText(/search prompts, attachments, responses/i)
    await user.type(searchInput, 'test')
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Search error:', expect.any(Error))
      expect(screen.queryByTestId('search-results')).not.toBeInTheDocument()
    })
    
    consoleSpy.mockRestore()
  })

  it('does not search with empty query', async () => {
    const user = userEvent.setup()
    render(<Header />)
    
    const searchInput = screen.getByPlaceholderText(/search prompts, attachments, responses/i)
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(mockApi.search).not.toHaveBeenCalled()
    })
  })
})

