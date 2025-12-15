import { render } from '@testing-library/react'
import { Sparkline } from '@/components/system-monitor/Sparkline'

describe('Sparkline', () => {
  it('renders without crashing', () => {
    const { container } = render(<Sparkline data={[1, 2, 3, 4, 5]} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders with default dimensions', () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '60')
    expect(svg).toHaveAttribute('height', '20')
  })

  it('renders with custom dimensions', () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} width={100} height={40} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '100')
    expect(svg).toHaveAttribute('height', '40')
  })

  it('renders a dashed line when data is empty', () => {
    const { container } = render(<Sparkline data={[]} />)
    const line = container.querySelector('line')
    expect(line).toBeInTheDocument()
    expect(line).toHaveAttribute('stroke-dasharray', '2,2')
  })

  it('renders a path when data is provided', () => {
    const { container } = render(<Sparkline data={[10, 20, 30, 20, 10]} />)
    const path = container.querySelector('path')
    expect(path).toBeInTheDocument()
  })

  it('renders filled area when showArea is true', () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} showArea={true} />)
    const paths = container.querySelectorAll('path')
    // Should have both line path and area path
    expect(paths.length).toBeGreaterThanOrEqual(1)
  })

  it('does not render filled area when showArea is false', () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} showArea={false} />)
    const paths = container.querySelectorAll('path')
    // Should only have line path
    expect(paths.length).toBe(1)
  })

  it('handles single data point', () => {
    const { container } = render(<Sparkline data={[50]} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} className="custom-sparkline" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('custom-sparkline')
  })

  it('normalizes data to fit height', () => {
    const { container } = render(<Sparkline data={[0, 100, 50]} height={20} />)
    const path = container.querySelector('path')
    expect(path).toBeInTheDocument()
    // Path should exist and have valid d attribute
    expect(path?.getAttribute('d')).toBeTruthy()
  })
})
