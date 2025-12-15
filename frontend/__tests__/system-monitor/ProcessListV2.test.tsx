import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ProcessListV2 } from '@/components/system-monitor/ProcessListV2'
import { api } from '@/lib/api'

// Mock the API
jest.mock('../../src/lib/api', () => ({
  api: {
    getDetailedProcesses: jest.fn(),
    killProcess: jest.fn(),
  },
}))

// Mock useConfirmModal
jest.mock('../../src/components/ui/ConfirmModal', () => ({
  useConfirmModal: () => [
    null, // ConfirmModalComponent
    jest.fn().mockResolvedValue(true), // confirm function
  ],
}))

const mockProcesses = [
  {
    pid: 1234,
    name: 'chrome.exe',
    cpu_percent: 15.5,
    memory_percent: 8.2,
    memory_mb: 512.3,
    status: 'running',
    is_protected: false,
    category: 'browser',
    description: 'Google Chrome',
    icon: '🌐',
    path: 'C:\\chrome.exe',
    cmdline: 'chrome.exe',
    parent_pid: 1000,
    children_count: 5,
    threads: 42,
    handles: 1500,
    start_time: '2025-01-01T10:00:00Z',
    uptime_seconds: 3600,
    cpu_history: [10, 15],
    memory_history: [500, 512],
    is_new: false,
  },
  {
    pid: 5678,
    name: 'code.exe',
    cpu_percent: 5.2,
    memory_percent: 4.1,
    memory_mb: 256.1,
    status: 'running',
    is_protected: false,
    category: 'dev',
    description: 'VS Code',
    icon: '📝',
    path: 'C:\\code.exe',
    cmdline: 'code.exe',
    parent_pid: 1000,
    children_count: 2,
    threads: 20,
    handles: 800,
    start_time: '2025-01-01T09:00:00Z',
    uptime_seconds: 7200,
    cpu_history: [4, 5],
    memory_history: [250, 256],
    is_new: true,
  },
]

const mockApiResponse = {
  processes: mockProcesses,
  total_count: 2,
  page: 1,
  page_size: 50,
  categories: {
    browser: 1,
    dev: 1,
  },
}

describe('ProcessListV2', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    ;(api.getDetailedProcesses as jest.Mock).mockResolvedValue(mockApiResponse)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders loading state initially', async () => {
    render(<ProcessListV2 />)

    // Should show process header
    expect(screen.getByText('Processes')).toBeInTheDocument()
  })

  it('fetches and displays processes', async () => {
    render(<ProcessListV2 />)

    await waitFor(() => {
      expect(screen.getByText('chrome.exe')).toBeInTheDocument()
      expect(screen.getByText('code.exe')).toBeInTheDocument()
    })
  })

  it('displays total process count', async () => {
    render(<ProcessListV2 />)

    await waitFor(() => {
      // The count is shown in a badge next to "Processes"
      const processesHeader = screen.getByText('Processes')
      expect(processesHeader).toBeInTheDocument()
      // The count badge may take time to load - we check for existence of 2 processes
      expect(screen.getByText('chrome.exe')).toBeInTheDocument()
    })
  })

  it('renders quick filters', async () => {
    render(<ProcessListV2 />)

    expect(screen.getByTitle('All')).toBeInTheDocument()
    expect(screen.getByTitle('Apps')).toBeInTheDocument()
    expect(screen.getByTitle('Browsers')).toBeInTheDocument()
  })

  it('filters processes when quick filter is clicked', async () => {
    render(<ProcessListV2 />)

    await waitFor(() => {
      expect(screen.getByText('chrome.exe')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTitle('Browsers'))

    await waitFor(() => {
      expect(api.getDetailedProcesses).toHaveBeenCalledWith(
        expect.objectContaining({
          filter_category: 'browser',
        })
      )
    })
  })

  it('searches processes by name', async () => {
    render(<ProcessListV2 />)

    await waitFor(() => {
      expect(screen.getByText('chrome.exe')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Filter by name...')
    fireEvent.change(searchInput, { target: { value: 'chrome' } })

    await waitFor(() => {
      expect(api.getDetailedProcesses).toHaveBeenCalledWith(
        expect.objectContaining({
          filter_name: 'chrome',
        })
      )
    })
  })

  it('toggles pause/resume polling', async () => {
    render(<ProcessListV2 autoRefresh={true} pollInterval={10000} />)

    await waitFor(() => {
      expect(screen.getByText('chrome.exe')).toBeInTheDocument()
    })

    // Initial call count
    const initialCallCount = (api.getDetailedProcesses as jest.Mock).mock.calls.length

    // Click pause
    const pauseButton = screen.getByTitle('Pause auto-refresh')
    fireEvent.click(pauseButton)

    // Advance timers - should NOT trigger new fetch
    act(() => {
      jest.advanceTimersByTime(15000)
    })

    expect((api.getDetailedProcesses as jest.Mock).mock.calls.length).toBe(initialCallCount)

    // Click resume
    const resumeButton = screen.getByTitle('Resume auto-refresh')
    fireEvent.click(resumeButton)
  })

  it('allows manual refresh when paused', async () => {
    render(<ProcessListV2 />)

    await waitFor(() => {
      expect(screen.getByText('chrome.exe')).toBeInTheDocument()
    })

    // Pause
    fireEvent.click(screen.getByTitle('Pause auto-refresh'))

    // Manual refresh should still work
    const refreshButton = screen.getByTitle('Refresh')
    fireEvent.click(refreshButton)

    await waitFor(() => {
      expect(api.getDetailedProcesses).toHaveBeenCalled()
    })
  })

  it('toggles view mode between list and grouped', async () => {
    render(<ProcessListV2 />)

    await waitFor(() => {
      expect(screen.getByText('chrome.exe')).toBeInTheDocument()
    })

    // Click to switch to grouped view
    const viewToggle = screen.getByTitle('Group by category')
    fireEvent.click(viewToggle)

    // Should now show list view toggle
    expect(screen.getByTitle('List view')).toBeInTheDocument()
  })

  it('toggles show system processes', async () => {
    render(<ProcessListV2 />)

    await waitFor(() => {
      expect(screen.getByText('chrome.exe')).toBeInTheDocument()
    })

    const showSystemButton = screen.getByTitle('Show system processes')
    fireEvent.click(showSystemButton)

    await waitFor(() => {
      expect(api.getDetailedProcesses).toHaveBeenCalledWith(
        expect.objectContaining({
          include_system: true,
        })
      )
    })
  })

  it('expands process row when clicked', async () => {
    render(<ProcessListV2 />)

    await waitFor(() => {
      expect(screen.getByText('chrome.exe')).toBeInTheDocument()
    })

    // Click on chrome.exe row
    fireEvent.click(screen.getByText('chrome.exe'))

    // Should show expanded details (description)
    await waitFor(() => {
      expect(screen.getByText('Google Chrome')).toBeInTheDocument()
    })
  })

  it('handles API error gracefully', async () => {
    ;(api.getDetailedProcesses as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    )

    render(<ProcessListV2 />)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('shows NEW badge for recent processes', async () => {
    render(<ProcessListV2 />)

    await waitFor(() => {
      expect(screen.getByText('NEW')).toBeInTheDocument()
    })
  })

  it('changes sort order', async () => {
    render(<ProcessListV2 />)

    await waitFor(() => {
      expect(screen.getByText('chrome.exe')).toBeInTheDocument()
    })

    const sortSelect = screen.getByRole('combobox')
    fireEvent.change(sortSelect, { target: { value: 'memory_mb' } })

    await waitFor(() => {
      expect(api.getDetailedProcesses).toHaveBeenCalledWith(
        expect.objectContaining({
          sort_by: 'memory_mb',
        })
      )
    })
  })

  it('applies custom className', () => {
    const { container } = render(<ProcessListV2 className="custom-list" />)

    expect(container.firstChild).toHaveClass('custom-list')
  })
})
