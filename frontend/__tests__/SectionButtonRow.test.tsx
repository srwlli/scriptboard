import { render, screen, fireEvent } from '@testing-library/react'
import { SectionButtonRow, type ButtonConfig } from '@/components/ui/SectionButtonRow'

describe('SectionButtonRow', () => {
  const mockButtons: ButtonConfig[] = [
    { text: 'Load', onClick: jest.fn(), variant: 'primary' },
    { text: 'Paste', onClick: jest.fn(), variant: 'secondary' },
    { text: 'View', onClick: jest.fn(), variant: 'secondary' },
    { text: 'Clear', onClick: jest.fn(), variant: 'secondary' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all buttons', () => {
    render(<SectionButtonRow buttons={mockButtons} />)
    
    expect(screen.getByText('Load')).toBeInTheDocument()
    expect(screen.getByText('Paste')).toBeInTheDocument()
    expect(screen.getByText('View')).toBeInTheDocument()
    expect(screen.getByText('Clear')).toBeInTheDocument()
  })

  it('calls onClick handler when button is clicked', () => {
    render(<SectionButtonRow buttons={mockButtons} />)
    
    const loadButton = screen.getByText('Load')
    fireEvent.click(loadButton)
    
    expect(mockButtons[0].onClick).toHaveBeenCalledTimes(1)
  })

  it('applies primary variant styling to first button', () => {
    render(<SectionButtonRow buttons={mockButtons} />)
    
    const loadButton = screen.getByText('Load')
    expect(loadButton).toHaveClass('bg-[#1a7f37]')
    expect(loadButton).toHaveClass('text-white')
  })

  it('applies secondary variant styling to other buttons', () => {
    render(<SectionButtonRow buttons={mockButtons} />)
    
    const pasteButton = screen.getByText('Paste')
    expect(pasteButton).toHaveClass('bg-[#161b22]')
    expect(pasteButton).toHaveClass('text-[#c9d1d9]')
  })

  it('disables button when disabled prop is true', () => {
    const disabledButtons: ButtonConfig[] = [
      { text: 'Disabled', onClick: jest.fn(), variant: 'primary', disabled: true },
    ]
    
    render(<SectionButtonRow buttons={disabledButtons} />)
    
    const button = screen.getByText('Disabled')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
  })

  it('renders buttons in a centered row', () => {
    const { container } = render(<SectionButtonRow buttons={mockButtons} />)
    
    const buttonRow = container.firstChild
    expect(buttonRow).toHaveClass('flex')
    expect(buttonRow).toHaveClass('justify-center')
  })
})

