import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionManagerPanel } from '@/components/SessionManagerPanel'
import { api } from '@/lib/api'

// Mock the API client
jest.mock('@/lib/api', () => ({
  api: {
    exportJson: jest.fn(),
    saveSession: jest.fn(),
    clearPrompt: jest.fn(),
    clearAttachments: jest.fn(),
    clearResponses: jest.fn(),
  },
}))

const mockApi = api as jest.Mocked<typeof api>

describe('SessionManagerPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    ;(navigator.clipboard.writeText as jest.Mock) = jest.fn().mockResolvedValue(undefined)
    // Mock window.confirm
    window.confirm = jest.fn()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('renders session manager panel', () => {
    render(<SessionManagerPanel />)
    expect(screen.getByText('Session Manager')).toBeInTheDocument()
  })

  it('displays all action buttons', () => {
    render(<SessionManagerPanel />)
    expect(screen.getByRole('button', { name: /copy all json/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save session/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /load session/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument()
  })

  it('copies JSON to clipboard', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const mockJson = { prompt: 'test', attachments: [], responses: [] }
    mockApi.exportJson.mockResolvedValue(mockJson)
    
    render(<SessionManagerPanel />)
    
    const copyButton = screen.getByRole('button', { name: /copy all json/i })
    await user.click(copyButton)
    
    await waitFor(() => {
      expect(mockApi.exportJson).toHaveBeenCalled()
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(JSON.stringify(mockJson, null, 2))
      expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument()
    })
  })

  it('saves session', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    mockApi.saveSession.mockResolvedValue({ status: 'ok', filename: 'session_123.json' })
    
    render(<SessionManagerPanel />)
    
    const saveButton = screen.getByRole('button', { name: /save session/i })
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(mockApi.saveSession).toHaveBeenCalled()
      expect(screen.getByText('Saved: session_123.json')).toBeInTheDocument()
    })
  })

  it('shows load session message', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<SessionManagerPanel />)
    
    const loadButton = screen.getByRole('button', { name: /load session/i })
    await user.click(loadButton)
    
    await waitFor(() => {
      expect(screen.getByText('Load session - requires file picker (Electron)')).toBeInTheDocument()
    })
  })

  it('clears all when confirmed', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    ;(window.confirm as jest.Mock).mockReturnValue(true)
    mockApi.clearPrompt.mockResolvedValue({})
    mockApi.clearAttachments.mockResolvedValue({})
    mockApi.clearResponses.mockResolvedValue({})
    
    render(<SessionManagerPanel />)
    
    const clearButton = screen.getByRole('button', { name: /clear all/i })
    await user.click(clearButton)
    
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Clear all session data? This cannot be undone.')
      expect(mockApi.clearPrompt).toHaveBeenCalled()
      expect(mockApi.clearAttachments).toHaveBeenCalled()
      expect(mockApi.clearResponses).toHaveBeenCalled()
      expect(screen.getByText('All cleared!')).toBeInTheDocument()
    })
  })

  it('does not clear all when cancelled', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    ;(window.confirm as jest.Mock).mockReturnValue(false)
    
    render(<SessionManagerPanel />)
    
    const clearButton = screen.getByRole('button', { name: /clear all/i })
    await user.click(clearButton)
    
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled()
      expect(mockApi.clearPrompt).not.toHaveBeenCalled()
      expect(mockApi.clearAttachments).not.toHaveBeenCalled()
      expect(mockApi.clearResponses).not.toHaveBeenCalled()
    })
  })

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    mockApi.exportJson.mockRejectedValue(new Error('API error'))
    
    render(<SessionManagerPanel />)
    
    const copyButton = screen.getByRole('button', { name: /copy all json/i })
    await user.click(copyButton)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy JSON:', expect.any(Error))
      expect(screen.getByText('Failed to copy')).toBeInTheDocument()
    })
    
    consoleSpy.mockRestore()
  })

  it('disables buttons while loading', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    mockApi.saveSession.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<SessionManagerPanel />)
    
    const saveButton = screen.getByRole('button', { name: /save session/i })
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(saveButton).toBeDisabled()
    })
  })
})

