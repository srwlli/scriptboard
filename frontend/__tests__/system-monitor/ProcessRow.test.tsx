import { render, screen, fireEvent } from '@testing-library/react'
import { ProcessRow } from '@/components/system-monitor/ProcessRow'
import { DetailedProcessInfo } from '@/lib/api'

const mockProcess: DetailedProcessInfo = {
  pid: 1234,
  name: 'chrome.exe',
  cpu_percent: 15.5,
  memory_percent: 8.2,
  memory_mb: 512.3,
  status: 'running',
  is_protected: false,
  category: 'browser',
  description: 'Google Chrome web browser',
  icon: '🌐',
  path: 'C:\\Program Files\\Google\\Chrome\\chrome.exe',
  cmdline: 'chrome.exe --profile-directory="Default"',
  parent_pid: 1000,
  children_count: 5,
  threads: 42,
  handles: 1500,
  start_time: '2025-01-01T10:00:00Z',
  uptime_seconds: 3600,
  cpu_history: [10, 12, 15, 14, 15.5],
  memory_history: [500, 505, 510, 512, 512.3],
  is_new: false,
}

describe('ProcessRow', () => {
  const mockOnToggle = jest.fn()
  const mockOnKill = jest.fn()

  beforeEach(() => {
    mockOnToggle.mockClear()
    mockOnKill.mockClear()
  })

  it('renders process name and PID', () => {
    render(
      <ProcessRow
        process={mockProcess}
        isExpanded={false}
        onToggle={mockOnToggle}
        onKill={mockOnKill}
      />
    )

    expect(screen.getByText('chrome.exe')).toBeInTheDocument()
    expect(screen.getByText('PID: 1234')).toBeInTheDocument()
  })

  it('renders category icon', () => {
    render(
      <ProcessRow
        process={mockProcess}
        isExpanded={false}
        onToggle={mockOnToggle}
        onKill={mockOnKill}
      />
    )

    expect(screen.getByText('🌐')).toBeInTheDocument()
  })

  it('renders CPU and memory stats', () => {
    render(
      <ProcessRow
        process={mockProcess}
        isExpanded={false}
        onToggle={mockOnToggle}
        onKill={mockOnKill}
      />
    )

    expect(screen.getByText('15.5%')).toBeInTheDocument()
    expect(screen.getByText('512.3 MB')).toBeInTheDocument()
  })

  it('calls onToggle when row is clicked', () => {
    render(
      <ProcessRow
        process={mockProcess}
        isExpanded={false}
        onToggle={mockOnToggle}
        onKill={mockOnKill}
      />
    )

    // Click on the row (not the kill button)
    fireEvent.click(screen.getByText('chrome.exe'))
    expect(mockOnToggle).toHaveBeenCalled()
  })

  it('calls onKill when kill button is clicked', () => {
    render(
      <ProcessRow
        process={mockProcess}
        isExpanded={false}
        onToggle={mockOnToggle}
        onKill={mockOnKill}
      />
    )

    const killButton = screen.getByTitle('Kill process')
    fireEvent.click(killButton)

    expect(mockOnKill).toHaveBeenCalled()
    // Should not toggle when clicking kill
    expect(mockOnToggle).not.toHaveBeenCalled()
  })

  it('shows expanded details when isExpanded is true', () => {
    render(
      <ProcessRow
        process={mockProcess}
        isExpanded={true}
        onToggle={mockOnToggle}
        onKill={mockOnKill}
      />
    )

    // ProcessDetails should be visible
    expect(screen.getByText('Google Chrome web browser')).toBeInTheDocument()
  })

  it('hides details when isExpanded is false', () => {
    render(
      <ProcessRow
        process={mockProcess}
        isExpanded={false}
        onToggle={mockOnToggle}
        onKill={mockOnKill}
      />
    )

    // ProcessDetails description should not be visible
    expect(screen.queryByText('Google Chrome web browser')).not.toBeInTheDocument()
  })

  it('shows protected badge for protected processes', () => {
    const protectedProcess = { ...mockProcess, is_protected: true }

    render(
      <ProcessRow
        process={protectedProcess}
        isExpanded={false}
        onToggle={mockOnToggle}
        onKill={mockOnKill}
      />
    )

    // Multiple elements have this title (badge and kill button)
    const protectedElements = screen.getAllByTitle('Protected process')
    expect(protectedElements.length).toBeGreaterThan(0)
  })

  it('shows NEW badge for new processes', () => {
    const newProcess = { ...mockProcess, is_new: true }

    render(
      <ProcessRow
        process={newProcess}
        isExpanded={false}
        onToggle={mockOnToggle}
        onKill={mockOnKill}
      />
    )

    expect(screen.getByText('NEW')).toBeInTheDocument()
  })

  it('disables kill button for protected processes', () => {
    const protectedProcess = { ...mockProcess, is_protected: true }

    render(
      <ProcessRow
        process={protectedProcess}
        isExpanded={false}
        onToggle={mockOnToggle}
        onKill={mockOnKill}
      />
    )

    // Find the kill button specifically (it's a button element)
    const killButton = screen.getByRole('button', { name: /protected process/i })
    expect(killButton).toHaveClass('cursor-not-allowed')
  })

  it('highlights high CPU usage', () => {
    const highCpuProcess = { ...mockProcess, cpu_percent: 75.5 }

    render(
      <ProcessRow
        process={highCpuProcess}
        isExpanded={false}
        onToggle={mockOnToggle}
        onKill={mockOnKill}
      />
    )

    const cpuText = screen.getByText('75.5%')
    expect(cpuText).toHaveClass('text-red-500')
  })

  it('shows killing state when isKilling is true', () => {
    render(
      <ProcessRow
        process={mockProcess}
        isExpanded={false}
        onToggle={mockOnToggle}
        onKill={mockOnKill}
        isKilling={true}
      />
    )

    const killButton = screen.getByTitle('Kill process')
    expect(killButton).toBeDisabled()
  })
})
