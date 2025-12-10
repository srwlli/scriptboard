import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ManagementSection } from '@/components/ClassicLayout/ManagementSection'
import { api } from '@/lib/api'

// Mock the API client
jest.mock('@/lib/api', () => ({
  api: {
    getSession: jest.fn(),
    exportJson: jest.fn(),
    clearPrompt: jest.fn(),
    clearAttachments: jest.fn(),
    clearResponses: jest.fn(),
    getPreviewFull: jest.fn(),
  },
}))

// Mock Electron API
const mockElectronAPI = {
  selectFolder: jest.fn(),
}

beforeAll(() => {
  (global as any).window = {
    ...global.window,
    electronAPI: mockElectronAPI,
  }
  ;(global as any).confirm = jest.fn(() => true)
})

const mockApi = api as jest.Mocked<typeof api>

describe('ManagementSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(navigator.clipboard.readText as jest.Mock) = jest.fn().mockResolvedValue('test clipboard')
    ;(navigator.clipboard.writeText as jest.Mock) = jest.fn().mockResolvedValue(undefined)
  })

  it('renders all buttons', async () => {
    mockApi.getSession.mockResolvedValue({ has_prompt: false, attachment_count: 0, response_count: 0, total_chars: 0 })
    render(<ManagementSection />)
    
    await waitFor(() => {
      expect(screen.getByText('Copy All')).toBeInTheDocument()
      expect(screen.getByText('Save As')).toBeInTheDocument()
      expect(screen.getByText('View')).toBeInTheDocument()
      expect(screen.getByText('Clear All')).toBeInTheDocument()
    })
  })

  it('displays management status', async () => {
    mockApi.getSession.mockResolvedValue({ has_prompt: true, attachment_count: 3, response_count: 5, total_chars: 1000 })
    render(<ManagementSection />)
    
    await waitFor(() => {
      expect(screen.getByText(/Prompts: 1/)).toBeInTheDocument()
      expect(screen.getByText(/Attachments: 3/)).toBeInTheDocument()
      expect(screen.getByText(/Responses: 5/)).toBeInTheDocument()
    })
  })

  it('copies all JSON to clipboard', async () => {
    const user = userEvent.setup()
    const mockJson = { prompt: 'test', attachments: [], responses: [] }
    mockApi.getSession.mockResolvedValue({ has_prompt: true, attachment_count: 0, response_count: 0, total_chars: 0 })
    mockApi.exportJson.mockResolvedValue(mockJson)
    
    render(<ManagementSection />)
    
    const copyButton = screen.getByText('Copy All')
    await user.click(copyButton)
    
    await waitFor(() => {
      expect(mockApi.exportJson).toHaveBeenCalled()
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(JSON.stringify(mockJson, null, 2))
    })
  })

  it('views combined preview', async () => {
    const user = userEvent.setup()
    mockApi.getSession.mockResolvedValue({ has_prompt: true, attachment_count: 1, response_count: 1, total_chars: 100 })
    mockApi.getPreviewFull.mockResolvedValue({ preview: '=== PROMPT ===\ntest\n\n=== ATTACHMENTS ===\nfile.txt' })
    
    render(<ManagementSection />)
    
    const viewButton = screen.getByText('View')
    await user.click(viewButton)
    
    await waitFor(() => {
      expect(screen.getByText('Preview')).toBeInTheDocument()
      expect(screen.getByText(/test/)).toBeInTheDocument()
    })
  })

  it('clears all session data', async () => {
    const user = userEvent.setup()
    mockApi.getSession.mockResolvedValue({ has_prompt: true, attachment_count: 2, response_count: 3, total_chars: 500 })
    mockApi.clearPrompt.mockResolvedValue({})
    mockApi.clearAttachments.mockResolvedValue({})
    mockApi.clearResponses.mockResolvedValue({})
    
    render(<ManagementSection />)
    
    const clearButton = screen.getByText('Clear All')
    await user.click(clearButton)
    
    await waitFor(() => {
      expect(mockApi.clearPrompt).toHaveBeenCalled()
      expect(mockApi.clearAttachments).toHaveBeenCalled()
      expect(mockApi.clearResponses).toHaveBeenCalled()
    })
  })
})

