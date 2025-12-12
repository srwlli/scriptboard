import { render, screen } from '@testing-library/react'
import { ThemeProvider, useTheme } from '@/components/theme'

// Test component that uses the hook
function TestComponent() {
  const { theme, setTheme, mode, setMode, resolvedMode, themes, modes } = useTheme()
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="mode">{mode}</div>
      <div data-testid="resolved-mode">{resolvedMode}</div>
      <div data-testid="themes">{themes.length}</div>
      <div data-testid="modes">{modes.length}</div>
      <button onClick={() => setTheme('default')}>Change Theme</button>
      <button onClick={() => setMode('light')}>Change Mode</button>
    </div>
  )
}

describe('useTheme', () => {
  it('throws error when used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useTheme must be used within a ThemeProvider')
    
    consoleSpy.mockRestore()
  })

  it('returns theme context when used inside ThemeProvider', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toBeInTheDocument()
    expect(screen.getByTestId('mode')).toBeInTheDocument()
    expect(screen.getByTestId('resolved-mode')).toBeInTheDocument()
    expect(screen.getByTestId('themes')).toBeInTheDocument()
    expect(screen.getByTestId('modes')).toBeInTheDocument()
  })

  it('provides setTheme function', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const button = screen.getByText('Change Theme')
    expect(button).toBeInTheDocument()
    expect(() => button.click()).not.toThrow()
  })

  it('provides setMode function', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const button = screen.getByText('Change Mode')
    expect(button).toBeInTheDocument()
    expect(() => button.click()).not.toThrow()
  })
})

