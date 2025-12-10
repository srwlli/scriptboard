import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PromptPanel } from '@/components/PromptPanel'
import { api } from '@/lib/api'

// Mock the API client
jest.mock('@/lib/api', () => ({
  api: {
    getSession: jest.fn(),
    setPrompt: jest.fn(),
    clearPrompt: jest.fn(),
    getPreview: jest.fn(),
  },
}))

const mockApi = api as jest.Mocked<typeof api>

describe('PromptPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock clipboard
    ;(navigator.clipboard.readText as jest.Mock) = jest.fn().mockResolvedValue('test clipboard text')
  })

  it('renders prompt panel', () => {
    mockApi.getSession.mockResolvedValue({ has_prompt: false, attachment_count: 0, response_count: 0, total_chars: 0 })
    render(<PromptPanel />)
    expect(screen.getByText('Prompt')).toBeInTheDocument()
  })

  it('displays no prompt status initially', async () => {
    mockApi.getSession.mockResolvedValue({ has_prompt: false, attachment_count: 0, response_count: 0, total_chars: 0 })
    render(<PromptPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('No prompt set')).toBeInTheDocument()
    })
  })

  it('displays prompt source when available', async () => {
    mockApi.getSession.mockResolvedValue({ has_prompt: true, prompt_source: 'file', attachment_count: 0, response_count: 0, total_chars: 0 })
    render(<PromptPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('Source: file')).toBeInTheDocument()
    })
  })

  it('pastes prompt from clipboard', async () => {
    const user = userEvent.setup()
    mockApi.getSession.mockResolvedValue({ has_prompt: false, attachment_count: 0, response_count: 0, total_chars: 0 })
    mockApi.setPrompt.mockResolvedValue({})
    
    render(<PromptPanel />)
    
    const pasteButton = screen.getByRole('button', { name: /paste/i })
    await user.click(pasteButton)
    
    await waitFor(() => {
      expect(navigator.clipboard.readText).toHaveBeenCalled()
      expect(mockApi.setPrompt).toHaveBeenCalledWith('test clipboard text')
      expect(screen.getByText('Source: manual')).toBeInTheDocument()
    })
  })

  it('views prompt from preview', async () => {
    const user = userEvent.setup()
    mockApi.getSession.mockResolvedValue({ has_prompt: true, prompt_source: 'file', attachment_count: 0, response_count: 0, total_chars: 0 })
    mockApi.getPreview.mockResolvedValue({
      preview: '=== PROMPT ===\ntest prompt content\n\n=== ATTACHMENTS ===',
    })
    
    render(<PromptPanel />)
    
    const viewButton = screen.getByRole('button', { name: /view/i })
    await user.click(viewButton)
    
    await waitFor(() => {
      expect(mockApi.getPreview).toHaveBeenCalled()
      expect(screen.getByText('test prompt content')).toBeInTheDocument()
    })
  })

  it('clears prompt', async () => {
    const user = userEvent.setup()
    mockApi.getSession.mockResolvedValue({ has_prompt: true, prompt_source: 'file', attachment_count: 0, response_count: 0, total_chars: 0 })
    mockApi.clearPrompt.mockResolvedValue({})
    
    render(<PromptPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('Source: file')).toBeInTheDocument()
    })
    
    const clearButton = screen.getByRole('button', { name: /clear/i })
    await user.click(clearButton)
    
    await waitFor(() => {
      expect(mockApi.clearPrompt).toHaveBeenCalled()
      expect(screen.getByText('No prompt set')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    mockApi.getSession.mockRejectedValue(new Error('API error'))
    
    render(<PromptPanel />)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load session status:', expect.any(Error))
    })
    
    consoleSpy.mockRestore()
  })
})

