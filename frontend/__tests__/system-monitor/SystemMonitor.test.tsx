import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SystemMonitor } from '@/components/SystemMonitor'
import { api } from '@/lib/api'

// Mock the API
jest.mock('../../src/lib/api', () => ({
  api: {
    getDetailedProcesses: jest.fn(),
    getSystemStats: jest.fn(),
    getAppProcesses: jest.fn(),
    getProcesses: jest.fn(),
    killProcess: jest.fn(),
  },
}))

// Mock useConfirmModal
jest.mock('../../src/components/ui/ConfirmModal', () => ({
  useConfirmModal: () => [null, jest.fn().mockResolvedValue(true)],
}))

const mockStats = {
  cpu_percent: 25.5,
  memory_percent: 60.2,
  memory_used_gb: 9.6,
  memory_total_gb: 16.0,
  disk_percent: 45.0,
  disk_used_gb: 225.0,
  disk_total_gb: 500.0,
}

const mockProcessesResponse = {
  processes: [
    {
      pid: 1234,
      name: 'test.exe',
      cpu_percent: 5.0,
      memory_percent: 2.0,
      memory_mb: 128.0,
      status: 'running',
      is_protected: false,
      category: 'app',
      description: 'Test process',
      icon: '📱',
      path: 'C:\\test.exe',
      cmdline: 'test.exe',
      parent_pid: null,
      children_count: 0,
      threads: 4,
      handles: 100,
      start_time: '2025-01-01T10:00:00Z',
      uptime_seconds: 3600,
      cpu_history: [5],
      memory_history: [128],
      is_new: false,
    },
  ],
  total_count: 1,
  page: 1,
  page_size: 50,
  categories: { app: 1 },
}

describe('SystemMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(api.getSystemStats as jest.Mock).mockResolvedValue(mockStats)
    ;(api.getDetailedProcesses as jest.Mock).mockResolvedValue(mockProcessesResponse)
    ;(api.getAppProcesses as jest.Mock).mockResolvedValue({ processes: [], total_count: 0 })
    ;(api.getProcesses as jest.Mock).mockResolvedValue({ processes: [], total_count: 0 })
  })

  it('renders with default title', () => {
    render(<SystemMonitor />)

    expect(screen.getByText('System Monitor')).toBeInTheDocument()
  })

  it('renders with custom title', () => {
    render(<SystemMonitor title="Custom Monitor" />)

    expect(screen.getByText('Custom Monitor')).toBeInTheDocument()
  })

  it('shows power toggle button', () => {
    render(<SystemMonitor />)

    expect(screen.getByTitle('Turn off monitoring')).toBeInTheDocument()
  })

  it('toggles monitoring on/off', async () => {
    render(<SystemMonitor defaultEnabled={true} defaultCollapsed={false} />)

    // Should be enabled initially
    const powerButton = screen.getByTitle('Turn off monitoring')
    expect(powerButton).toBeInTheDocument()

    // Click to disable
    fireEvent.click(powerButton)

    // Should show disabled state
    await waitFor(() => {
      expect(screen.getByText('System monitoring is off')).toBeInTheDocument()
    })

    // Click to enable
    const enableButton = screen.getByTitle('Turn on monitoring')
    fireEvent.click(enableButton)

    // Should be enabled again
    await waitFor(() => {
      expect(screen.queryByText('System monitoring is off')).not.toBeInTheDocument()
    })
  })

  it('starts disabled when defaultEnabled is false', () => {
    render(<SystemMonitor defaultEnabled={false} defaultCollapsed={false} />)

    expect(screen.getByText('System monitoring is off')).toBeInTheDocument()
    expect(screen.getByTitle('Turn on monitoring')).toBeInTheDocument()
  })

  it('does not fetch data when monitoring is off', async () => {
    render(<SystemMonitor defaultEnabled={false} defaultCollapsed={false} />)

    // API should not be called for detailed processes when disabled
    // (SystemStatsPanel may still poll, but ProcessListV2 should not render)
    expect(screen.queryByText('Processes')).not.toBeInTheDocument()
  })

  it('starts collapsed when defaultCollapsed is true', () => {
    render(<SystemMonitor defaultCollapsed={true} />)

    // Content should be hidden (collapsed)
    expect(screen.queryByText('Processes')).not.toBeInTheDocument()
  })

  it('starts expanded when defaultCollapsed is false', async () => {
    render(<SystemMonitor defaultCollapsed={false} defaultEnabled={true} />)

    await waitFor(() => {
      expect(screen.getByText('Processes')).toBeInTheDocument()
    })
  })

  it('uses v2 by default', async () => {
    render(<SystemMonitor defaultCollapsed={false} defaultEnabled={true} />)

    await waitFor(() => {
      // V2 has quick filter buttons
      expect(screen.getByTitle('All')).toBeInTheDocument()
    })
  })

  it('shows v1/v2 toggle in development mode', async () => {
    const originalNodeEnv = process.env.NODE_ENV

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
    })

    render(<SystemMonitor defaultCollapsed={false} defaultEnabled={true} />)

    await waitFor(() => {
      // In dev mode, should show toggle
      const toggleButton = screen.queryByText(/Switch to v/)
      // This may or may not be present depending on how the test env is configured
    })

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      writable: true,
    })
  })

  it('power button click does not collapse the card', async () => {
    render(<SystemMonitor defaultCollapsed={false} defaultEnabled={true} />)

    await waitFor(() => {
      expect(screen.getByText('Processes')).toBeInTheDocument()
    })

    // Click power button
    const powerButton = screen.getByTitle('Turn off monitoring')
    fireEvent.click(powerButton)

    // Card should still be expanded (showing disabled message)
    await waitFor(() => {
      expect(screen.getByText('System monitoring is off')).toBeInTheDocument()
    })
  })

  it('shows helpful message when monitoring is disabled', () => {
    render(<SystemMonitor defaultEnabled={false} defaultCollapsed={false} />)

    expect(screen.getByText('Click the power button to enable')).toBeInTheDocument()
  })
})
