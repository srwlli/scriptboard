import { render, screen } from '@testing-library/react'
import { StatusLabel } from '@/components/ui/StatusLabel'

describe('StatusLabel', () => {
  it('renders status text', () => {
    render(<StatusLabel text="No prompt" />)
    
    expect(screen.getByText('No prompt')).toBeInTheDocument()
  })

  it('applies correct styling classes', () => {
    const { container } = render(<StatusLabel text="Test status" />)
    
    const label = container.firstChild
    expect(label).toHaveClass('bg-[#0d1117]')
    expect(label).toHaveClass('text-[#6e7681]')
    expect(label).toHaveClass('text-sm')
    expect(label).toHaveClass('w-full')
  })

  it('renders different status messages', () => {
    const { rerender } = render(<StatusLabel text="Responses: 5 | Characters: 1,234" />)
    
    expect(screen.getByText('Responses: 5 | Characters: 1,234')).toBeInTheDocument()
    
    rerender(<StatusLabel text="No attachments" />)
    expect(screen.getByText('No attachments')).toBeInTheDocument()
  })

  it('applies custom className when provided', () => {
    const { container } = render(<StatusLabel text="Test" className="custom-class" />)
    
    const label = container.firstChild
    expect(label).toHaveClass('custom-class')
  })
})

