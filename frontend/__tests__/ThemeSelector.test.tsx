import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider } from '@/components/theme'
import { ThemeSelector } from '@/components/theme/ThemeSelector'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock matchMedia
const mockMatchMedia = jest.fn()
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

describe('ThemeSelector', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })
    document.body.style.overflow = ''
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  const renderWithProvider = (isOpen: boolean) => {
    return render(
      <ThemeProvider>
        <ThemeSelector isOpen={isOpen} onClose={mockOnClose} />
      </ThemeProvider>
    )
  }

  it('does not render when isOpen is false', () => {
    renderWithProvider(false)
    expect(screen.queryByText('Select Theme')).not.toBeInTheDocument()
  })

  it('renders modal when isOpen is true', () => {
    renderWithProvider(true)
    expect(screen.getByText('Select Theme')).toBeInTheDocument()
  })

  it('renders theme cards', () => {
    renderWithProvider(true)
    expect(screen.getByText('Default')).toBeInTheDocument()
  })

  it('shows current theme badge', async () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'app-theme') return 'default'
      return null
    })

    renderWithProvider(true)

    await waitFor(() => {
      expect(screen.getByText('Current')).toBeInTheDocument()
    })
  })

  it('calls onClose when backdrop is clicked', () => {
    renderWithProvider(true)
    
    const backdrop = screen.getByRole('dialog')
    fireEvent.click(backdrop)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onClose when Escape key is pressed', () => {
    renderWithProvider(true)
    
    fireEvent.keyDown(document, { key: 'Escape' })
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onClose when Cancel button is clicked', () => {
    renderWithProvider(true)
    
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onClose when X button is clicked', () => {
    renderWithProvider(true)
    
    const closeButton = screen.getByLabelText('Close theme selector')
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('highlights selected theme card', async () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'app-theme') return 'default'
      return null
    })

    renderWithProvider(true)

    await waitFor(() => {
      const defaultCard = screen.getByText('Default').closest('button')
      expect(defaultCard).toHaveClass('border-primary')
    })
  })

  it('updates preview when theme card is clicked', async () => {
    renderWithProvider(true)

    const defaultCard = screen.getByText('Default').closest('button')
    if (defaultCard) {
      fireEvent.click(defaultCard)
      
      await waitFor(() => {
        expect(defaultCard).toHaveClass('border-primary')
      })
    }
  })

  it('applies theme and closes when Apply button is clicked', async () => {
    renderWithProvider(true)

    const applyButton = screen.getByText('Apply')
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('app-theme', 'default')
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('prevents body scroll when modal is open', () => {
    renderWithProvider(true)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body scroll when modal closes', () => {
    const { rerender } = renderWithProvider(true)
    expect(document.body.style.overflow).toBe('hidden')
    
    rerender(
      <ThemeProvider>
        <ThemeSelector isOpen={false} onClose={mockOnClose} />
      </ThemeProvider>
    )
    
    expect(document.body.style.overflow).toBe('')
  })

  it('renders ModeSwitcher in header', () => {
    renderWithProvider(true)
    expect(screen.getByLabelText(/Switch to Light mode/i)).toBeInTheDocument()
  })
})

