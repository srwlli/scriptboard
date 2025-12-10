import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeToggle } from '@/components/ThemeToggle'

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

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    document.documentElement.setAttribute('data-theme', 'light')
  })

  it('renders theme toggle button', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toBeInTheDocument()
  })

  it('displays moon icon for light theme', () => {
    mockLocalStorage.getItem.mockReturnValue('light')
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toHaveTextContent('🌙')
  })

  it('displays sun icon for dark theme', () => {
    mockLocalStorage.getItem.mockReturnValue('dark')
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toHaveTextContent('☀️')
  })

  it('toggles theme on click', () => {
    mockLocalStorage.getItem.mockReturnValue('light')
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: /toggle theme/i })
    
    // Initially light theme
    expect(button).toHaveTextContent('🌙')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    
    // Click to toggle
    fireEvent.click(button)
    
    // Should be dark theme
    expect(button).toHaveTextContent('☀️')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark')
    
    // Click again to toggle back
    fireEvent.click(button)
    
    // Should be light theme again
    expect(button).toHaveTextContent('🌙')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light')
  })

  it('loads theme from localStorage on mount', () => {
    mockLocalStorage.getItem.mockReturnValue('dark')
    render(<ThemeToggle />)
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('theme')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('defaults to light theme if no saved theme', () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    render(<ThemeToggle />)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})

