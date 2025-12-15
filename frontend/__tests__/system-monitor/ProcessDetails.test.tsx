import { render, screen } from '@testing-library/react'
import { ProcessDetails } from '@/components/system-monitor/ProcessDetails'
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
  path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  cmdline: 'chrome.exe --profile-directory="Default" --flag',
  parent_pid: 1000,
  children_count: 5,
  threads: 42,
  handles: 1500,
  start_time: '2025-01-01T10:00:00Z',
  uptime_seconds: 3665, // 1 hour, 1 minute, 5 seconds
  cpu_history: [10, 12, 15, 14, 15.5],
  memory_history: [500, 505, 510, 512, 512.3],
  is_new: false,
}

describe('ProcessDetails', () => {
  it('renders process description', () => {
    render(<ProcessDetails process={mockProcess} />)

    expect(screen.getByText('Google Chrome web browser')).toBeInTheDocument()
  })

  it('renders process path', () => {
    render(<ProcessDetails process={mockProcess} />)

    // Path contains chrome.exe
    const pathElements = screen.getAllByText(/chrome\.exe/)
    expect(pathElements.length).toBeGreaterThan(0)
  })

  it('renders command line', () => {
    render(<ProcessDetails process={mockProcess} />)

    expect(screen.getByText(/--profile-directory/)).toBeInTheDocument()
  })

  it('renders uptime formatted correctly', () => {
    render(<ProcessDetails process={mockProcess} />)

    // 3665 seconds = 1h 1m
    expect(screen.getByText('1h 1m')).toBeInTheDocument()
  })

  it('renders thread count', () => {
    render(<ProcessDetails process={mockProcess} />)

    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders handle count', () => {
    render(<ProcessDetails process={mockProcess} />)

    expect(screen.getByText('1500')).toBeInTheDocument()
  })

  it('renders parent PID when present', () => {
    render(<ProcessDetails process={mockProcess} />)

    expect(screen.getByText('1000')).toBeInTheDocument()
  })

  it('renders children count when greater than zero', () => {
    render(<ProcessDetails process={mockProcess} />)

    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('does not render parent PID when null', () => {
    const processWithoutParent = { ...mockProcess, parent_pid: null }

    render(<ProcessDetails process={processWithoutParent} />)

    expect(screen.queryByText('Parent PID')).not.toBeInTheDocument()
  })

  it('does not render children count when zero', () => {
    const processWithoutChildren = { ...mockProcess, children_count: 0 }

    render(<ProcessDetails process={processWithoutChildren} />)

    // Should not show "Children" label when count is 0
    const childrenLabels = screen.queryAllByText('Children')
    expect(childrenLabels.length).toBe(0)
  })

  it('renders CPU history chart when data exists', () => {
    const { container } = render(<ProcessDetails process={mockProcess} />)

    // Should have at least one SVG for sparklines
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('renders memory history chart when data exists', () => {
    render(<ProcessDetails process={mockProcess} />)

    expect(screen.getByText('Memory History')).toBeInTheDocument()
    expect(screen.getByText('512.3 MB')).toBeInTheDocument()
  })

  it('formats uptime in seconds correctly', () => {
    const shortProcess = { ...mockProcess, uptime_seconds: 45 }

    render(<ProcessDetails process={shortProcess} />)

    expect(screen.getByText('45s')).toBeInTheDocument()
  })

  it('formats uptime in minutes correctly', () => {
    const minuteProcess = { ...mockProcess, uptime_seconds: 300 }

    render(<ProcessDetails process={minuteProcess} />)

    expect(screen.getByText('5m')).toBeInTheDocument()
  })

  it('formats uptime in days correctly', () => {
    const dayProcess = { ...mockProcess, uptime_seconds: 90000 } // 1d 1h

    render(<ProcessDetails process={dayProcess} />)

    expect(screen.getByText('1d 1h')).toBeInTheDocument()
  })

  it('truncates long paths', () => {
    const longPathProcess = {
      ...mockProcess,
      path: 'C:\\Very\\Long\\Path\\That\\Goes\\On\\And\\On\\And\\On\\Until\\It\\Is\\Really\\Long\\chrome.exe',
    }

    render(<ProcessDetails process={longPathProcess} />)

    // Should be truncated with ellipsis at start
    const pathElement = screen.getByText(/\.\.\./)
    expect(pathElement).toBeInTheDocument()
  })

  it('shows N/A for null path', () => {
    const noPathProcess = { ...mockProcess, path: null }

    render(<ProcessDetails process={noPathProcess} />)

    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <ProcessDetails process={mockProcess} className="custom-details" />
    )

    expect(container.firstChild).toHaveClass('custom-details')
  })
})
