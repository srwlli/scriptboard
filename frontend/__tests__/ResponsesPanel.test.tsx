import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResponsesPanel } from '@/components/ResponsesPanel'
import { api } from '@/lib/api'

// Mock the API client
jest.mock('@/lib/api', () => ({
  api: {
    getResponsesSummary: jest.fn(),
    getConfig: jest.fn(),
    addResponse: jest.fn(),
    clearResponses: jest.fn(),
  },
}))

const mockApi = api as jest.Mocked<typeof api>

describe('ResponsesPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(navigator.clipboard.readText as jest.Mock) = jest.fn().mockResolvedValue('test response')
    // Mock window.open
    window.open = jest.fn()
  })

  it('renders responses panel', () => {
    mockApi.getResponsesSummary.mockResolvedValue({ count: 0, char_count: 0, responses: [] })
    mockApi.getConfig.mockResolvedValue({ llm_urls: [] })
    mockApi.getResponses.mockResolvedValue({ responses: [] })
    render(<ResponsesPanel />)
    expect(screen.getByText('Responses')).toBeInTheDocument()
  })

  it('displays response count', async () => {
    mockApi.getResponsesSummary.mockResolvedValue({ count: 5, char_count: 1000, responses: [] })
    mockApi.getConfig.mockResolvedValue({ llm_urls: [] })
    mockApi.getResponses.mockResolvedValue({ responses: [] })
    render(<ResponsesPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('5 responses')).toBeInTheDocument()
    })
  })

  it('displays single response count correctly', async () => {
    mockApi.getResponsesSummary.mockResolvedValue({ count: 1, char_count: 100, responses: [] })
    mockApi.getConfig.mockResolvedValue({ llm_urls: [] })
    mockApi.getResponses.mockResolvedValue({ responses: [] })
    render(<ResponsesPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('1 response')).toBeInTheDocument()
    })
  })

  it('displays LLM URLs', async () => {
    const mockLlmUrls = [
      { label: 'ChatGPT', url: 'https://chat.openai.com' },
      { label: 'Claude', url: 'https://claude.ai' },
    ]
    mockApi.getResponsesSummary.mockResolvedValue({ count: 0, char_count: 0, responses: [] })
    mockApi.getConfig.mockResolvedValue({ llm_urls: mockLlmUrls })
    mockApi.getResponses.mockResolvedValue({ responses: [] })
    render(<ResponsesPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('ChatGPT')).toBeInTheDocument()
      expect(screen.getByText('Claude')).toBeInTheDocument()
    })
  })

  it('opens LLM URL in new window', async () => {
    const user = userEvent.setup()
    const mockLlmUrls = [
      { label: 'ChatGPT', url: 'https://chat.openai.com' },
    ]
    mockApi.getResponsesSummary.mockResolvedValue({ count: 0, char_count: 0, responses: [] })
    mockApi.getConfig.mockResolvedValue({ llm_urls: mockLlmUrls })
    mockApi.getResponses.mockResolvedValue({ responses: [] })
    
    render(<ResponsesPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('ChatGPT')).toBeInTheDocument()
    })
    
    const llmButton = screen.getByText('ChatGPT')
    await user.click(llmButton)
    
    expect(window.open).toHaveBeenCalledWith('https://chat.openai.com', '_blank')
  })

  it('pastes response from clipboard', async () => {
    const user = userEvent.setup()
    mockApi.getResponsesSummary.mockResolvedValue({ count: 0, char_count: 0, responses: [] })
    mockApi.getConfig.mockResolvedValue({ llm_urls: [] })
    mockApi.getResponses.mockResolvedValue({ responses: [] })
    mockApi.addResponse.mockResolvedValue({})
    
    render(<ResponsesPanel />)
    
    const pasteButton = screen.getByRole('button', { name: /paste/i })
    await user.click(pasteButton)
    
    await waitFor(() => {
      expect(navigator.clipboard.readText).toHaveBeenCalled()
      expect(mockApi.addResponse).toHaveBeenCalledWith('test response')
      expect(mockApi.getResponsesSummary).toHaveBeenCalledTimes(2) // Initial load + after paste
    })
  })

  it('clears responses', async () => {
    const user = userEvent.setup()
    mockApi.getResponsesSummary.mockResolvedValue({ count: 5, char_count: 1000, responses: [] })
    mockApi.getConfig.mockResolvedValue({ llm_urls: [] })
    mockApi.getResponses.mockResolvedValue({ responses: [] })
    mockApi.clearResponses.mockResolvedValue({})
    
    render(<ResponsesPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('5 responses')).toBeInTheDocument()
    })
    
    const clearButton = screen.getByRole('button', { name: /clear/i })
    await user.click(clearButton)
    
    await waitFor(() => {
      expect(mockApi.clearResponses).toHaveBeenCalled()
      expect(screen.getByText('0 responses')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    mockApi.getResponsesSummary.mockRejectedValue(new Error('API error'))
    mockApi.getConfig.mockResolvedValue({ llm_urls: [] })
    
    render(<ResponsesPanel />)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load data:', expect.any(Error))
    })
    
    consoleSpy.mockRestore()
  })
})

