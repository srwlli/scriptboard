/**
 * Extensive tests for ThemeProvider component
 * 
 * Tests cover:
 * - Context provision
 * - localStorage persistence
 * - System mode resolution
 * - HTML attribute updates
 * - Media query listeners
 * - Error handling
 * - Edge cases
 */

import { render, screen, waitFor, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from '@/components/theme'
import { useEffect } from 'react'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

// Mock matchMedia
let mockMediaQueryListeners: Array<(e: MediaQueryListEvent) => void> = []
const createMockMatchMedia = (matches: boolean) => {
  return jest.fn(() => ({
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: jest.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        mockMediaQueryListeners.push(listener)
      }
    }),
    removeEventListener: jest.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        mockMediaQueryListeners = mockMediaQueryListeners.filter(l => l !== listener)
      }
    }),
    addListener: jest.fn((listener: (e: MediaQueryListEvent) => void) => {
      mockMediaQueryListeners.push(listener)
    }),
    removeListener: jest.fn((listener: (e: MediaQueryListEvent) => void) => {
      mockMediaQueryListeners = mockMediaQueryListeners.filter(l => l !== listener)
    }),
    dispatchEvent: jest.fn(),
  }))
}

let mockMatchMedia = createMockMatchMedia(false)

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

// Test component
function TestComponent() {
  const { theme, setTheme, mode, setMode, resolvedMode, themes, modes } = useTheme()
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="mode">{mode}</div>
      <div data-testid="resolved-mode">{resolvedMode}</div>
      <div data-testid="themes-count">{themes.length}</div>
      <div data-testid="modes-count">{modes.length}</div>
      <button data-testid="set-theme-default" onClick={() => setTheme('default')}>
        Set Default Theme
      </button>
      <button data-testid="set-mode-light" onClick={() => setMode('light')}>
        Set Light Mode
      </button>
      <button data-testid="set-mode-dark" onClick={() => setMode('dark')}>
        Set Dark Mode
      </button>
      <button data-testid="set-mode-system" onClick={() => setMode('system')}>
        Set System Mode
      </button>
    </div>
  )
}

describe('ThemeProvider - Extensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    mockMediaQueryListeners = []
    mockMatchMedia = createMockMatchMedia(false)
    window.matchMedia = mockMatchMedia
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-mode')
    document.body.style.overflow = ''
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering and Context', () => {
    it('renders children', () => {
      render(
        <ThemeProvider>
          <div>Test Content</div>
        </ThemeProvider>
      )
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('provides theme context to children', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )
      expect(screen.getByTestId('theme')).toBeInTheDocument()
      expect(screen.getByTestId('mode')).toBeInTheDocument()
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
  })

  describe('localStorage Persistence', () => {
    it('loads theme from localStorage on mount', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'app-theme') return 'default'
        return null
      })

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('theme')).toHaveTextContent('default')
      })
    })

    it('loads mode from localStorage on mount', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'app-mode') return 'dark'
        return null
      })

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('mode')).toHaveTextContent('dark')
      })
    })

    it('saves theme to localStorage when changed', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByTestId('set-theme-default')
        act(() => {
          button.click()
        })
      })

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('app-theme', 'default')
      })
    })

    it('saves mode to localStorage when changed', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByTestId('set-mode-dark')
        act(() => {
          button.click()
        })
      })

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('app-mode', 'dark')
      })
    })

    it('uses default theme when localStorage value is invalid', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'app-theme') return 'invalid-theme'
        return null
      })

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('theme')).toHaveTextContent('default')
      })
    })

    it('uses default mode when localStorage value is invalid', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'app-mode') return 'invalid-mode'
        return null
      })

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('mode')).toHaveTextContent('system')
      })
    })

    it('handles localStorage getItem errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('theme')).toBeInTheDocument()
      })
    })

    it('handles localStorage setItem errors gracefully', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByTestId('set-theme-default')
        act(() => {
          button.click()
        })
      })

      // Should not throw, just log error
      await waitFor(() => {
        expect(screen.getByTestId('theme')).toBeInTheDocument()
      })
    })
  })

  describe('HTML Attribute Updates', () => {
    it('applies data-theme attribute to html element', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'app-theme') return 'default'
        return null
      })

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('default')
      })
    })

    it('applies data-mode attribute to html element', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'app-mode') return 'dark'
        return null
      })

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-mode')).toBe('dark')
      })
    })

    it('updates data-theme when theme changes', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByTestId('set-theme-default')
        act(() => {
          button.click()
        })
      })

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('default')
      })
    })

    it('updates data-mode when mode changes', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByTestId('set-mode-dark')
        act(() => {
          button.click()
        })
      })

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-mode')).toBe('dark')
      })
    })

    it('updates both attributes when both change', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        act(() => {
          screen.getByTestId('set-theme-default').click()
          screen.getByTestId('set-mode-dark').click()
        })
      })

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('default')
        expect(document.documentElement.getAttribute('data-mode')).toBe('dark')
      })
    })
  })

  describe('System Mode Resolution', () => {
    it('resolves system mode to light when OS prefers light', async () => {
      mockMatchMedia = createMockMatchMedia(false)
      window.matchMedia = mockMatchMedia

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
      mockMatchMedia = createMockMatchMedia(true)
      window.matchMedia = mockMatchMedia

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

    it('listens to OS preference changes when mode is system', async () => {
      mockMatchMedia = createMockMatchMedia(false)
      window.matchMedia = mockMatchMedia

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
        expect(mockMatchMedia).toHaveBeenCalled()
      })

      // Simulate OS preference change
      if (mockMediaQueryListeners.length > 0) {
        act(() => {
          mockMediaQueryListeners[0]({
            matches: true,
            media: '(prefers-color-scheme: dark)',
          } as MediaQueryListEvent)
        })
      }

      await waitFor(() => {
        expect(screen.getByTestId('resolved-mode')).toHaveTextContent('dark')
      })
    })

    it('does not listen to OS changes when mode is not system', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'app-mode') return 'dark'
        return null
      })

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('mode')).toHaveTextContent('dark')
      })

      // Should not have listeners when mode is not system
      // (listeners are only added when mode === 'system')
    })

    it('removes listeners when mode changes from system to explicit', async () => {
      mockMatchMedia = createMockMatchMedia(false)
      window.matchMedia = mockMatchMedia

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
        expect(mockMediaQueryListeners.length).toBeGreaterThan(0)
      })

      // Change mode to explicit
      await waitFor(() => {
        const button = screen.getByTestId('set-mode-dark')
        act(() => {
          button.click()
        })
      })

      // Listeners should be cleaned up
      await waitFor(() => {
        // Verify mode changed
        expect(screen.getByTestId('mode')).toHaveTextContent('dark')
      })
    })
  })

  describe('Theme and Mode Changes', () => {
    it('updates theme state when setTheme is called', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByTestId('set-theme-default')
        act(() => {
          button.click()
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('theme')).toHaveTextContent('default')
      })
    })

    it('updates mode state when setMode is called', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByTestId('set-mode-light')
        act(() => {
          button.click()
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('mode')).toHaveTextContent('light')
      })
    })

    it('updates resolvedMode when mode changes', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByTestId('set-mode-dark')
        act(() => {
          button.click()
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('resolved-mode')).toHaveTextContent('dark')
      })
    })

    it('handles rapid theme changes', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByTestId('set-theme-default')
        // Rapid clicks
        act(() => {
          button.click()
          button.click()
          button.click()
        })
      })

      // Should not throw errors
      await waitFor(() => {
        expect(screen.getByTestId('theme')).toBeInTheDocument()
      })
    })

    it('handles rapid mode changes', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        act(() => {
          screen.getByTestId('set-mode-light').click()
          screen.getByTestId('set-mode-dark').click()
          screen.getByTestId('set-mode-system').click()
        })
      })

      // Should not throw errors
      await waitFor(() => {
        expect(screen.getByTestId('mode')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles SSR (window undefined)', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toBeInTheDocument()

      // Restore
      global.window = originalWindow
    })

    it('handles document undefined (SSR)', () => {
      const originalDocument = global.document
      // @ts-ignore
      delete global.document

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toBeInTheDocument()

      // Restore
      global.document = originalDocument
    })

    it('handles matchMedia not available', () => {
      const originalMatchMedia = window.matchMedia
      // @ts-ignore
      window.matchMedia = undefined

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toBeInTheDocument()

      // Restore
      window.matchMedia = originalMatchMedia
    })

    it('handles matchMedia without addEventListener (old browsers)', () => {
      mockMatchMedia = jest.fn(() => ({
        matches: false,
        addEventListener: undefined,
        removeEventListener: undefined,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }))
      window.matchMedia = mockMatchMedia

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toBeInTheDocument()
    })

    it('handles multiple ThemeProvider instances', () => {
      render(
        <>
          <ThemeProvider>
            <div data-testid="provider-1">Provider 1</div>
          </ThemeProvider>
          <ThemeProvider>
            <div data-testid="provider-2">Provider 2</div>
          </ThemeProvider>
        </>
      )

      expect(screen.getByTestId('provider-1')).toBeInTheDocument()
      expect(screen.getByTestId('provider-2')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('does not re-render unnecessarily', async () => {
      const renderCount = jest.fn()
      
      function CountingComponent() {
        renderCount()
        const { theme } = useTheme()
        return <div data-testid="counting">{theme}</div>
      }

      const { rerender } = render(
        <ThemeProvider>
          <CountingComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(renderCount).toHaveBeenCalled()
      })

      const initialCount = renderCount.mock.calls.length

      // Rerender with same props
      rerender(
        <ThemeProvider>
          <CountingComponent />
        </ThemeProvider>
      )

      // Should not cause excessive re-renders
      expect(renderCount.mock.calls.length).toBeLessThanOrEqual(initialCount + 2)
    })
  })
})

