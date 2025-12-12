import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '@/components/theme'
import { ModeSwitcher } from '@/components/theme/ModeSwitcher'

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

describe('ModeSwitcher', () => {
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
  })

  const renderWithProvider = () => {
    return render(
      <ThemeProvider>
        <ModeSwitcher />
      </ThemeProvider>
    )
  }

  it('renders three mode buttons', () => {
    renderWithProvider()
    
    expect(screen.getByLabelText(/Switch to Light mode/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Switch to Dark mode/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Switch to System mode/i)).toBeInTheDocument()
  })

  it('highlights active mode button', async () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'app-mode') return 'dark'
      return null
    })

    renderWithProvider()

    const darkButton = screen.getByLabelText(/Switch to Dark mode/i)
    expect(darkButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls setMode when button is clicked', async () => {
    renderWithProvider()

    const lightButton = screen.getByLabelText(/Switch to Light mode/i)
    fireEvent.click(lightButton)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('app-mode', 'light')
  })

  it('updates active state after clicking different mode', async () => {
    renderWithProvider()

    const darkButton = screen.getByLabelText(/Switch to Dark mode/i)
    fireEvent.click(darkButton)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(darkButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('has accessible labels for all buttons', () => {
    renderWithProvider()

    const buttons = [
      screen.getByLabelText(/Switch to Light mode/i),
      screen.getByLabelText(/Switch to Dark mode/i),
      screen.getByLabelText(/Switch to System mode/i),
    ]

    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label')
      expect(button).toHaveAttribute('title')
    })
  })
})

