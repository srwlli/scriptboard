import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AttachmentsPanel } from '@/components/AttachmentsPanel'
import { api } from '@/lib/api'

// Mock the API client
jest.mock('@/lib/api', () => ({
  api: {
    listAttachments: jest.fn(),
    addAttachmentText: jest.fn(),
    clearAttachments: jest.fn(),
  },
}))

const mockApi = api as jest.Mocked<typeof api>

describe('AttachmentsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(navigator.clipboard.readText as jest.Mock) = jest.fn().mockResolvedValue('test attachment')
  })

  it('renders attachments panel', () => {
    mockApi.listAttachments.mockResolvedValue([])
    render(<AttachmentsPanel />)
    expect(screen.getByText('Attachments')).toBeInTheDocument()
  })

  it('displays attachment count', async () => {
    mockApi.listAttachments.mockResolvedValue([])
    render(<AttachmentsPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('0 attachments')).toBeInTheDocument()
    })
  })

  it('displays single attachment count correctly', async () => {
    mockApi.listAttachments.mockResolvedValue([
      { id: 'att_1', filename: 'test.txt', lines: 10, binary: false },
    ])
    render(<AttachmentsPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('1 attachment')).toBeInTheDocument()
    })
  })

  it('displays attachments list', async () => {
    const mockAttachments = [
      { id: 'att_1', filename: 'file1.txt', lines: 10, binary: false },
      { id: 'att_2', filename: 'file2.txt', lines: 20, binary: false },
    ]
    mockApi.listAttachments.mockResolvedValue(mockAttachments)
    render(<AttachmentsPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument()
      expect(screen.getByText('file2.txt')).toBeInTheDocument()
      expect(screen.getByText('10 lines')).toBeInTheDocument()
      expect(screen.getByText('20 lines')).toBeInTheDocument()
    })
  })

  it('displays binary flag for binary files', async () => {
    mockApi.listAttachments.mockResolvedValue([
      { id: 'att_1', filename: 'image.png', lines: 0, binary: true },
    ])
    render(<AttachmentsPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('image.png')).toBeInTheDocument()
      expect(screen.getByText(/binary/i)).toBeInTheDocument()
    })
  })

  it('pastes attachment from clipboard', async () => {
    const user = userEvent.setup()
    mockApi.listAttachments.mockResolvedValue([])
    mockApi.addAttachmentText.mockResolvedValue({})
    mockApi.listAttachments.mockResolvedValueOnce([]).mockResolvedValueOnce([
      { id: 'att_1', filename: 'clipboard.txt', lines: 1, binary: false },
    ])
    
    render(<AttachmentsPanel />)
    
    const pasteButton = screen.getByRole('button', { name: /paste/i })
    await user.click(pasteButton)
    
    await waitFor(() => {
      expect(navigator.clipboard.readText).toHaveBeenCalled()
      expect(mockApi.addAttachmentText).toHaveBeenCalledWith('test attachment')
      expect(mockApi.listAttachments).toHaveBeenCalledTimes(2) // Initial load + after paste
    })
  })

  it('clears attachments', async () => {
    const user = userEvent.setup()
    mockApi.listAttachments.mockResolvedValue([
      { id: 'att_1', filename: 'test.txt', lines: 10, binary: false },
    ])
    mockApi.clearAttachments.mockResolvedValue({})
    
    render(<AttachmentsPanel />)
    
    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument()
    })
    
    const clearButton = screen.getByRole('button', { name: /clear/i })
    await user.click(clearButton)
    
    await waitFor(() => {
      expect(mockApi.clearAttachments).toHaveBeenCalled()
      expect(screen.queryByText('test.txt')).not.toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    mockApi.listAttachments.mockRejectedValue(new Error('API error'))
    
    render(<AttachmentsPanel />)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load attachments:', expect.any(Error))
    })
    
    consoleSpy.mockRestore()
  })
})

