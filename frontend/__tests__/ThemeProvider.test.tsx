import { render, screen, waitFor } from '@testing-library/react'
import { ThemeProvider, useTheme } from '@/components/theme'
import { act } from 'react'

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

// Mock matchMedia for system preference
const mockMatchMedia = jest.fn()
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

// Test component that uses the hook
function TestComponent() {
  const { theme, setTheme, mode, setMode, resolvedMode, themes, modes } = useTheme()
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="mode">{mode}</div>
      <div data-testid="resolved-mode">{resolvedMode}</div>
      <div data-testid="themes-count">{themes.length}</div>
      <div data-testid="modes-count">{modes.length}</div>
      <button onClick={() => setTheme('default')}>Set Theme</button>
      <button onClick={() => setMode('dark')}>Set Mode</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-mode')
    
    // Default to light mode for system preference
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })
  })

  it('renders children', () => {
    render(
      <ThemeProvider>
        <div>Test Content</div>
      </ThemeProvider>
    )
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('provides default theme and mode', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('default')
      expect(screen.getByTestId('mode')).toHaveTextContent('system')
    })
  })

  it('loads theme from localStorage', async () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'app-theme') return 'default'
      if (key === 'app-mode') return 'dark'
      return null
    })

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('default')
      expect(screen.getByTestId('mode')).toHaveTextContent('dark')
    })
  })

  it('applies data-theme and data-mode attributes', async () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'app-theme') return 'default'
      if (key === 'app-mode') return 'dark'
      return null
    })

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('default')
      expect(document.documentElement.getAttribute('data-mode')).toBe('dark')
    })
  })

  it('resolves system mode to light when OS prefers light', async () => {
    mockMatchMedia.mockReturnValue({
      matches: false, // prefers light
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'app-mode') return 'system'
      return null
    })

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('resolved-mode')).toHaveTextContent('light')
      expect(document.documentElement.getAttribute('data-mode')).toBe('light')
    })
  })

  it('resolves system mode to dark when OS prefers dark', async () => {
    mockMatchMedia.mockReturnValue({
      matches: true, // prefers dark
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'app-mode') return 'system'
      return null
    })

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('resolved-mode')).toHaveTextContent('dark')
      expect(document.documentElement.getAttribute('data-mode')).toBe('dark')
    })
  })

  it('saves theme and mode to localStorage when changed', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      const setThemeButton = screen.getByText('Set Theme')
      const setModeButton = screen.getByText('Set Mode')
      
      act(() => {
        setThemeButton.click()
        setModeButton.click()
      })
    })

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('app-theme', 'default')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('app-mode', 'dark')
    })
  })

  it('provides themes and modes arrays', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('themes-count')).toHaveTextContent('1')
      expect(screen.getByTestId('modes-count')).toHaveTextContent('3')
    })
  })

  it('handles localStorage errors gracefully', async () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('localStorage error')
    })

    // Should not throw
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toBeInTheDocument()
    })
  })
})

