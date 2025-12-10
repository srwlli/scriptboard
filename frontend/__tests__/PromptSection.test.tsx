import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PromptSection } from '@/components/ClassicLayout/PromptSection'
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

// Mock Electron API
const mockElectronAPI = {
  openFileDialog: jest.fn(),
  readFile: jest.fn(),
}

beforeAll(() => {
  (global as any).window = {
    ...global.window,
    electronAPI: mockElectronAPI,
  }
})

const mockApi = api as jest.Mocked<typeof api>

describe('PromptSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(navigator.clipboard.readText as jest.Mock) = jest.fn().mockResolvedValue('test clipboard text')
  })

  it('renders all buttons', async () => {
    mockApi.getSession.mockResolvedValue({ has_prompt: false, attachment_count: 0, response_count: 0, total_chars: 0 })
    render(<PromptSection />)
    
    await waitFor(() => {
      expect(screen.getByText('Load')).toBeInTheDocument()
      expect(screen.getByText('Paste')).toBeInTheDocument()
      expect(screen.getByText('View')).toBeInTheDocument()
      expect(screen.getByText('Clear')).toBeInTheDocument()
    })
  })

  it('displays status label', async () => {
    mockApi.getSession.mockResolvedValue({ has_prompt: false, attachment_count: 0, response_count: 0, total_chars: 0 })
    render(<PromptSection />)
    
    await waitFor(() => {
      expect(screen.getByText('No prompt')).toBeInTheDocument()
    })
  })

  it('pastes prompt from clipboard', async () => {
    const user = userEvent.setup()
    mockApi.getSession.mockResolvedValue({ has_prompt: false, attachment_count: 0, response_count: 0, total_chars: 0 })
    mockApi.setPrompt.mockResolvedValue({})
    
    render(<PromptSection />)
    
    const pasteButton = screen.getByText('Paste')
    await user.click(pasteButton)
    
    await waitFor(() => {
      expect(mockApi.setPrompt).toHaveBeenCalledWith('test clipboard text')
    })
  })

  it('loads prompt from file in Electron', async () => {
    const user = userEvent.setup()
    mockApi.getSession.mockResolvedValue({ has_prompt: false, attachment_count: 0, response_count: 0, total_chars: 0 })
    mockApi.setPrompt.mockResolvedValue({})
    mockElectronAPI.openFileDialog.mockResolvedValue({ canceled: false, filePath: '/path/to/file.json' })
    mockElectronAPI.readFile.mockResolvedValue({ content: 'file content', filename: 'file.json' })
    
    render(<PromptSection />)
    
    const loadButton = screen.getByText('Load')
    await user.click(loadButton)
    
    await waitFor(() => {
      expect(mockElectronAPI.openFileDialog).toHaveBeenCalled()
      expect(mockElectronAPI.readFile).toHaveBeenCalledWith('/path/to/file.json')
      expect(mockApi.setPrompt).toHaveBeenCalledWith('file content')
    })
  })

  it('views prompt in modal', async () => {
    const user = userEvent.setup()
    mockApi.getSession.mockResolvedValue({ has_prompt: true, prompt_source: 'file', attachment_count: 0, response_count: 0, total_chars: 0 })
    mockApi.getPreview.mockResolvedValue({
      preview: '=== PROMPT ===\ntest prompt content',
    })
    
    render(<PromptSection />)
    
    const viewButton = screen.getByText('View')
    await user.click(viewButton)
    
    await waitFor(() => {
      expect(screen.getByText('Prompt')).toBeInTheDocument()
      expect(screen.getByText(/test prompt content/)).toBeInTheDocument()
    })
  })

  it('clears prompt', async () => {
    const user = userEvent.setup()
    mockApi.getSession.mockResolvedValue({ has_prompt: true, prompt_source: 'file', attachment_count: 0, response_count: 0, total_chars: 0 })
    mockApi.clearPrompt.mockResolvedValue({})
    
    render(<PromptSection />)
    
    const clearButton = screen.getByText('Clear')
    await user.click(clearButton)
    
    await waitFor(() => {
      expect(mockApi.clearPrompt).toHaveBeenCalled()
    })
  })
})

