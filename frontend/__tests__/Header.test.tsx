import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from '@/components/Header'

// Mock DrawerNavigation
jest.mock('@/components/DrawerNavigation', () => ({
  DrawerNavigation: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <div data-testid="drawer-navigation" data-open={isOpen}>
      <button onClick={onClose}>Close Drawer</button>
    </div>
  ),
}))

describe('Header', () => {
  it('renders header with title', () => {
    render(<Header />)
    expect(screen.getByText('Scriptboard')).toBeInTheDocument()
  })

  it('renders drawer menu button', () => {
    render(<Header />)
    const menuButton = screen.getByLabelText('Open navigation menu')
    expect(menuButton).toBeInTheDocument()
  })

  it('opens drawer when menu button is clicked', async () => {
    const user = userEvent.setup()
    render(<Header />)
    
    const menuButton = screen.getByLabelText('Open navigation menu')
    await user.click(menuButton)
    
    const drawer = screen.getByTestId('drawer-navigation')
    expect(drawer).toHaveAttribute('data-open', 'true')
  })
})

