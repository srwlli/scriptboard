import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AttachmentsSection } from '@/components/ClassicLayout/AttachmentsSection'
import { api } from '@/lib/api'

// Mock the API client
jest.mock('@/lib/api', () => ({
  api: {
    listAttachments: jest.fn(),
    addAttachmentText: jest.fn(),
    clearAttachments: jest.fn(),
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

describe('AttachmentsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(navigator.clipboard.readText as jest.Mock) = jest.fn().mockResolvedValue('test clipboard text')
  })

  it('renders all buttons', async () => {
    mockApi.listAttachments.mockResolvedValue([])
    render(<AttachmentsSection />)
    
    await waitFor(() => {
      expect(screen.getByText('Load')).toBeInTheDocument()
      expect(screen.getByText('Paste')).toBeInTheDocument()
      expect(screen.getByText('View')).toBeInTheDocument()
      expect(screen.getByText('Clear')).toBeInTheDocument()
    })
  })

  it('displays attachment status', async () => {
    mockApi.listAttachments.mockResolvedValue([])
    render(<AttachmentsSection />)
    
    await waitFor(() => {
      expect(screen.getByText('No attachments')).toBeInTheDocument()
    })
  })

  it('displays attachment count and lines', async () => {
    const mockAttachments = [
      { id: '1', filename: 'file1.txt', lines: 10, binary: false },
      { id: '2', filename: 'file2.txt', lines: 20, binary: false },
    ]
    mockApi.listAttachments.mockResolvedValue(mockAttachments as any)
    render(<AttachmentsSection />)
    
    await waitFor(() => {
      expect(screen.getByText(/file1.txt/)).toBeInTheDocument()
      expect(screen.getByText(/30 lines/)).toBeInTheDocument()
    })
  })

  it('pastes attachment from clipboard', async () => {
    const user = userEvent.setup()
    mockApi.listAttachments.mockResolvedValue([])
    mockApi.addAttachmentText.mockResolvedValue({})
    
    render(<AttachmentsSection />)
    
    const pasteButton = screen.getByText('Paste')
    await user.click(pasteButton)
    
    await waitFor(() => {
      expect(mockApi.addAttachmentText).toHaveBeenCalledWith('test clipboard text', expect.stringContaining('clipboard-'))
    })
  })

  it('loads attachment from file in Electron', async () => {
    const user = userEvent.setup()
    mockApi.listAttachments.mockResolvedValue([])
    mockApi.addAttachmentText.mockResolvedValue({})
    mockElectronAPI.openFileDialog.mockResolvedValue({ canceled: false, filePath: '/path/to/file.txt' })
    mockElectronAPI.readFile.mockResolvedValue({ content: 'file content', filename: 'file.txt' })
    
    render(<AttachmentsSection />)
    
    const loadButton = screen.getByText('Load')
    await user.click(loadButton)
    
    await waitFor(() => {
      expect(mockElectronAPI.openFileDialog).toHaveBeenCalled()
      expect(mockApi.addAttachmentText).toHaveBeenCalledWith('file content', 'file.txt')
    })
  })

  it('clears attachments', async () => {
    const user = userEvent.setup()
    mockApi.listAttachments.mockResolvedValue([])
    mockApi.clearAttachments.mockResolvedValue({})
    
    render(<AttachmentsSection />)
    
    const clearButton = screen.getByText('Clear')
    await user.click(clearButton)
    
    await waitFor(() => {
      expect(mockApi.clearAttachments).toHaveBeenCalled()
    })
  })
})

