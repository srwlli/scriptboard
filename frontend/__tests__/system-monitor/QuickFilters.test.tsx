import { render, screen, fireEvent } from '@testing-library/react'
import { QuickFilters, QuickFilter } from '@/components/system-monitor/QuickFilters'

describe('QuickFilters', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('renders all filter buttons', () => {
    render(<QuickFilters active="all" onChange={mockOnChange} />)

    expect(screen.getByTitle('All')).toBeInTheDocument()
    expect(screen.getByTitle('Apps')).toBeInTheDocument()
    expect(screen.getByTitle('Browsers')).toBeInTheDocument()
    expect(screen.getByTitle('Dev')).toBeInTheDocument()
    expect(screen.getByTitle('System')).toBeInTheDocument()
    expect(screen.getByTitle('Media')).toBeInTheDocument()
    expect(screen.getByTitle('Chat')).toBeInTheDocument()
    expect(screen.getByTitle('Security')).toBeInTheDocument()
    expect(screen.getByTitle('High CPU')).toBeInTheDocument()
    expect(screen.getByTitle('Recent')).toBeInTheDocument()
  })

  it('highlights the active filter', () => {
    const { container } = render(<QuickFilters active="browsers" onChange={mockOnChange} />)

    const browsersButton = screen.getByTitle('Browsers')
    expect(browsersButton).toHaveClass('bg-primary')
  })

  it('calls onChange when a filter is clicked', () => {
    render(<QuickFilters active="all" onChange={mockOnChange} />)

    fireEvent.click(screen.getByTitle('Apps'))
    expect(mockOnChange).toHaveBeenCalledWith('apps')

    fireEvent.click(screen.getByTitle('High CPU'))
    expect(mockOnChange).toHaveBeenCalledWith('high_cpu')
  })

  it('displays counts when provided', () => {
    const counts: Partial<Record<QuickFilter, number>> = {
      all: 150,
      apps: 25,
      browsers: 10,
      high_cpu: 3,
    }

    render(<QuickFilters active="all" onChange={mockOnChange} counts={counts} />)

    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('does not display count badge for zero counts', () => {
    const counts: Partial<Record<QuickFilter, number>> = {
      all: 100,
      recent: 0,
    }

    render(<QuickFilters active="all" onChange={mockOnChange} counts={counts} />)

    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <QuickFilters active="all" onChange={mockOnChange} className="custom-filters" />
    )

    expect(container.firstChild).toHaveClass('custom-filters')
  })

  it('switches active filter styling correctly', () => {
    const { rerender } = render(<QuickFilters active="all" onChange={mockOnChange} />)

    let allButton = screen.getByTitle('All')
    expect(allButton).toHaveClass('bg-primary')

    rerender(<QuickFilters active="dev" onChange={mockOnChange} />)

    allButton = screen.getByTitle('All')
    const devButton = screen.getByTitle('Dev')

    expect(allButton).not.toHaveClass('bg-primary')
    expect(devButton).toHaveClass('bg-primary')
  })
})
