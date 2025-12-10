import { render, screen, fireEvent } from '@testing-library/react'
import { FooterBar } from '@/components/ui/FooterBar'

// Mock window.innerWidth and innerHeight
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1920,
})

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 1080,
})

describe('FooterBar', () => {
  const mockOnLockSizeChange = jest.fn()
  const mockOnOnTopChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders status message when provided', () => {
    render(<FooterBar statusMessage="Ready" />)
    
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })

  it('renders character count', () => {
    render(<FooterBar charCount={1234} />)
    
    expect(screen.getByText(/Chars: 1,234/)).toBeInTheDocument()
  })

  it('renders window size when showSize is true', () => {
    render(<FooterBar showSize={true} />)
    
    expect(screen.getByText(/1920 x 1080/)).toBeInTheDocument()
  })

  it('does not render window size when showSize is false', () => {
    render(<FooterBar showSize={false} />)
    
    expect(screen.queryByText(/1920 x 1080/)).not.toBeInTheDocument()
  })

  it('renders Lock Size checkbox', () => {
    render(<FooterBar onLockSizeChange={mockOnLockSizeChange} />)
    
    const checkbox = screen.getByLabelText('Lock Size')
    expect(checkbox).toBeInTheDocument()
  })

  it('renders On Top checkbox', () => {
    render(<FooterBar onOnTopChange={mockOnOnTopChange} />)
    
    const checkbox = screen.getByLabelText('On Top')
    expect(checkbox).toBeInTheDocument()
  })

  it('calls onLockSizeChange when Lock Size checkbox is toggled', () => {
    render(<FooterBar lockSize={false} onLockSizeChange={mockOnLockSizeChange} />)
    
    const checkbox = screen.getByLabelText('Lock Size')
    fireEvent.change(checkbox, { target: { checked: true } })
    
    expect(mockOnLockSizeChange).toHaveBeenCalledWith(true)
  })

  it('calls onOnTopChange when On Top checkbox is toggled', () => {
    render(<FooterBar onTop={false} onOnTopChange={mockOnOnTopChange} />)
    
    const checkbox = screen.getByLabelText('On Top')
    fireEvent.change(checkbox, { target: { checked: true } })
    
    expect(mockOnOnTopChange).toHaveBeenCalledWith(true)
  })

  it('displays checked state for Lock Size', () => {
    render(<FooterBar lockSize={true} onLockSizeChange={mockOnLockSizeChange} />)
    
    const checkbox = screen.getByLabelText('Lock Size') as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  it('displays checked state for On Top', () => {
    render(<FooterBar onTop={true} onOnTopChange={mockOnOnTopChange} />)
    
    const checkbox = screen.getByLabelText('On Top') as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  it('formats large character counts with commas', () => {
    render(<FooterBar charCount={1234567} />)
    
    expect(screen.getByText(/Chars: 1,234,567/)).toBeInTheDocument()
  })
})

