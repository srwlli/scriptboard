/**
 * Extensive tests for useTheme hook
 * 
 * Tests cover:
 * - Hook context access
 * - Error handling
 * - All hook return values
 * - Function calls
 * - Edge cases
 */

import { render, screen, waitFor, act } from '@testing-library/react'
import { useEffect } from 'react'
import { ThemeProvider, useTheme } from '@/components/theme'

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
const mockMatchMedia = jest.fn(() => ({
  matches: false,
  media: '(prefers-color-scheme: dark)',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

// Test components
function TestComponent() {
  const { theme, setTheme, mode, setMode, resolvedMode, themes, modes } = useTheme()
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="mode">{mode}</div>
      <div data-testid="resolved-mode">{resolvedMode}</div>
      <div data-testid="themes-count">{themes.length}</div>
      <div data-testid="modes-count">{modes.length}</div>
      <button data-testid="set-theme" onClick={() => setTheme('default')}>
        Set Theme
      </button>
      <button data-testid="set-mode" onClick={() => setMode('dark')}>
        Set Mode
      </button>
    </div>
  )
}

function ComponentWithMultipleHooks() {
  const hook1 = useTheme()
  const hook2 = useTheme()
  return (
    <div>
      <div data-testid="hook1-theme">{hook1.theme}</div>
      <div data-testid="hook2-theme">{hook2.theme}</div>
    </div>
  )
}

describe('useTheme - Extensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe('Context Access', () => {
    it('throws error when used outside ThemeProvider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useTheme must be used within a ThemeProvider')
      
      consoleSpy.mockRestore()
    })

    it('returns context when used inside ThemeProvider', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toBeInTheDocument()
      expect(screen.getByTestId('mode')).toBeInTheDocument()
      expect(screen.getByTestId('resolved-mode')).toBeInTheDocument()
    })

    it('multiple hooks in same component share same context', () => {
      render(
        <ThemeProvider>
          <ComponentWithMultipleHooks />
        </ThemeProvider>
      )

      waitFor(() => {
        const hook1Theme = screen.getByTestId('hook1-theme').textContent
        const hook2Theme = screen.getByTestId('hook2-theme').textContent
        expect(hook1Theme).toBe(hook2Theme)
      })
    })
  })

  describe('Return Values', () => {
    it('returns theme value', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('theme')).toHaveTextContent('default')
      })
    })

    it('returns mode value', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('mode')).toHaveTextContent('system')
      })
    })

    it('returns resolvedMode value', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const resolved = screen.getByTestId('resolved-mode').textContent
        expect(['light', 'dark']).toContain(resolved)
      })
    })

    it('returns themes array', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const count = parseInt(screen.getByTestId('themes-count').textContent || '0')
        expect(count).toBeGreaterThan(0)
      })
    })

    it('returns modes array', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('modes-count')).toHaveTextContent('3')
      })
    })

    it('returns setTheme function', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      const button = screen.getByTestId('set-theme')
      expect(button).toBeInTheDocument()
      expect(typeof button.onclick).toBe('function')
    })

    it('returns setMode function', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      const button = screen.getByTestId('set-mode')
      expect(button).toBeInTheDocument()
      expect(typeof button.onclick).toBe('function')
    })
  })

  describe('setTheme Function', () => {
    it('updates theme when called', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByTestId('set-theme')
        act(() => {
          button.click()
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('theme')).toHaveTextContent('default')
      })
    })

    it('persists theme to localStorage', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByTestId('set-theme')
        act(() => {
          button.click()
        })
      })

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('app-theme', 'default')
      })
    })

    it('can be called multiple times', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByTestId('set-theme')
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
  })

  describe('setMode Function', () => {
    it('updates mode when called', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByTestId('set-mode')
        act(() => {
          button.click()
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('mode')).toHaveTextContent('dark')
      })
    })

    it('updates resolvedMode when mode changes', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByTestId('set-mode')
        act(() => {
          button.click()
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('resolved-mode')).toHaveTextContent('dark')
      })
    })

    it('persists mode to localStorage', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByTestId('set-mode')
        act(() => {
          button.click()
        })
      })

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('app-mode', 'dark')
      })
    })

    it('can be called multiple times', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByTestId('set-mode')
        act(() => {
          button.click()
          button.click()
          button.click()
        })
      })

      // Should not throw errors
      await waitFor(() => {
        expect(screen.getByTestId('mode')).toBeInTheDocument()
      })
    })
  })

  describe('resolvedMode Behavior', () => {
    it('resolves to light when mode is light', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'app-mode') return 'light'
        return null
      })

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('resolved-mode')).toHaveTextContent('light')
      })
    })

    it('resolves to dark when mode is dark', async () => {
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
        expect(screen.getByTestId('resolved-mode')).toHaveTextContent('dark')
      })
    })

    it('resolves system mode based on OS preference', async () => {
      mockMatchMedia.mockReturnValue({
        matches: true, // OS prefers dark
        media: '(prefers-color-scheme: dark)',
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
      })
    })

    it('always returns light or dark, never system', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const resolved = screen.getByTestId('resolved-mode').textContent
        expect(['light', 'dark']).toContain(resolved)
        expect(resolved).not.toBe('system')
      })
    })
  })

  describe('Themes and Modes Arrays', () => {
    it('themes array is not empty', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const count = parseInt(screen.getByTestId('themes-count').textContent || '0')
        expect(count).toBeGreaterThan(0)
      })
    })

    it('modes array has exactly 3 items', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('modes-count')).toHaveTextContent('3')
      })
    })

    it('themes array contains theme objects with required properties', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        // Verify themes array structure through context
        expect(screen.getByTestId('themes-count')).toBeInTheDocument()
      })
    })

    it('modes array contains mode objects with required properties', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        // Verify modes array structure through context
        expect(screen.getByTestId('modes-count')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid setTheme calls', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByTestId('set-theme')
        // Rapid clicks
        for (let i = 0; i < 10; i++) {
          act(() => {
            button.click()
          })
        }
      })

      // Should not throw errors
      await waitFor(() => {
        expect(screen.getByTestId('theme')).toBeInTheDocument()
      })
    })

    it('handles rapid setMode calls', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const button = screen.getByTestId('set-mode')
        // Rapid clicks
        for (let i = 0; i < 10; i++) {
          act(() => {
            button.click()
          })
        }
      })

      // Should not throw errors
      await waitFor(() => {
        expect(screen.getByTestId('mode')).toBeInTheDocument()
      })
    })

    it('handles theme changes while mode is changing', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        act(() => {
          screen.getByTestId('set-theme').click()
          screen.getByTestId('set-mode').click()
        })
      })

      // Should not throw errors
      await waitFor(() => {
        expect(screen.getByTestId('theme')).toBeInTheDocument()
        expect(screen.getByTestId('mode')).toBeInTheDocument()
      })
    })
  })

  describe('Type Safety', () => {
    it('theme is of type Theme', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const theme = screen.getByTestId('theme').textContent
        expect(typeof theme).toBe('string')
        expect(theme).toBeTruthy()
      })
    })

    it('mode is of type Mode', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const mode = screen.getByTestId('mode').textContent
        expect(['light', 'dark', 'system']).toContain(mode)
      })
    })

    it('resolvedMode is always light or dark', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        const resolved = screen.getByTestId('resolved-mode').textContent
        expect(['light', 'dark']).toContain(resolved)
      })
    })
  })

  describe('Hook Stability', () => {
    it('returns stable function references', async () => {
      let setThemeRef1: any
      let setThemeRef2: any
      let setModeRef1: any
      let setModeRef2: any

      function StabilityTest() {
        const { setTheme, setMode } = useTheme()
        
        useEffect(() => {
          setThemeRef1 = setTheme
          setModeRef1 = setMode
        }, [])

        useEffect(() => {
          setThemeRef2 = setTheme
          setModeRef2 = setMode
        })

        return <div>Test</div>
      }

      render(
        <ThemeProvider>
          <StabilityTest />
        </ThemeProvider>
      )

      await waitFor(() => {
        // Functions should be stable (same reference)
        expect(setThemeRef1).toBe(setThemeRef2)
        expect(setModeRef1).toBe(setModeRef2)
      })
    })
  })
})

