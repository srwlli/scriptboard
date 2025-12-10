import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResponsesSection } from '@/components/ClassicLayout/ResponsesSection'
import { api } from '@/lib/api'

// Mock the API client
jest.mock('@/lib/api', () => ({
  api: {
    getResponsesSummary: jest.fn(),
    getConfig: jest.fn(),
    addResponse: jest.fn(),
    clearResponses: jest.fn(),
    getResponses: jest.fn(),
  },
}))

const mockApi = api as jest.Mocked<typeof api>

describe('ResponsesSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(navigator.clipboard.readText as jest.Mock) = jest.fn().mockResolvedValue('test response')
    window.open = jest.fn()
  })

  it('renders all buttons', async () => {
    mockApi.getResponsesSummary.mockResolvedValue({ count: 0, char_count: 0, responses: [] })
    mockApi.getConfig.mockResolvedValue({ llm_urls: [] })
    render(<ResponsesSection />)
    
    await waitFor(() => {
      expect(screen.getByText('LLMs')).toBeInTheDocument()
      expect(screen.getByText('Paste')).toBeInTheDocument()
      expect(screen.getByText('View')).toBeInTheDocument()
      expect(screen.getByText('Clear')).toBeInTheDocument()
    })
  })

  it('displays response status', async () => {
    mockApi.getResponsesSummary.mockResolvedValue({ count: 5, char_count: 1234, responses: [] })
    mockApi.getConfig.mockResolvedValue({ llm_urls: [] })
    render(<ResponsesSection />)
    
    await waitFor(() => {
      expect(screen.getByText(/Responses: 5/)).toBeInTheDocument()
      expect(screen.getByText(/Characters: 1,234/)).toBeInTheDocument()
    })
  })

  it('opens all LLM URLs', async () => {
    const user = userEvent.setup()
    const mockLlmUrls = [
      { label: 'Claude', url: 'https://claude.ai' },
      { label: 'ChatGPT', url: 'https://chat.openai.com' },
    ]
    mockApi.getResponsesSummary.mockResolvedValue({ count: 0, char_count: 0, responses: [] })
    mockApi.getConfig.mockResolvedValue({ llm_urls: mockLlmUrls })
    
    render(<ResponsesSection />)
    
    const llmsButton = screen.getByText('LLMs')
    await user.click(llmsButton)
    
    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith('https://claude.ai', '_blank')
      expect(window.open).toHaveBeenCalledWith('https://chat.openai.com', '_blank')
    })
  })

  it('pastes response from clipboard', async () => {
    const user = userEvent.setup()
    mockApi.getResponsesSummary.mockResolvedValue({ count: 0, char_count: 0, responses: [] })
    mockApi.getConfig.mockResolvedValue({ llm_urls: [] })
    mockApi.addResponse.mockResolvedValue({})
    
    render(<ResponsesSection />)
    
    const pasteButton = screen.getByText('Paste')
    await user.click(pasteButton)
    
    await waitFor(() => {
      expect(mockApi.addResponse).toHaveBeenCalledWith('test response')
    })
  })

  it('views responses in modal', async () => {
    const user = userEvent.setup()
    const mockResponses = {
      responses: [
        { id: '1', source: 'Claude', content: 'Response 1', char_count: 100 },
        { id: '2', source: 'ChatGPT', content: 'Response 2', char_count: 200 },
      ],
    }
    mockApi.getResponsesSummary.mockResolvedValue({ count: 2, char_count: 300, responses: [] })
    mockApi.getConfig.mockResolvedValue({ llm_urls: [] })
    mockApi.getResponses.mockResolvedValue(mockResponses as any)
    
    render(<ResponsesSection />)
    
    const viewButton = screen.getByText('View')
    await user.click(viewButton)
    
    await waitFor(() => {
      expect(screen.getByText('Responses')).toBeInTheDocument()
      expect(screen.getByText(/Claude/)).toBeInTheDocument()
    })
  })

  it('clears responses', async () => {
    const user = userEvent.setup()
    mockApi.getResponsesSummary.mockResolvedValue({ count: 5, char_count: 1000, responses: [] })
    mockApi.getConfig.mockResolvedValue({ llm_urls: [] })
    mockApi.clearResponses.mockResolvedValue({})
    
    render(<ResponsesSection />)
    
    const clearButton = screen.getByText('Clear')
    await user.click(clearButton)
    
    await waitFor(() => {
      expect(mockApi.clearResponses).toHaveBeenCalled()
    })
  })
})

