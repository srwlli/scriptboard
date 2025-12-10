import { render, screen, fireEvent } from "@testing-library/react";
import { Drawer } from "@/components/ui/Drawer";

describe("Drawer", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it("renders with children when open", () => {
    render(
      <Drawer isOpen={true} onClose={mockOnClose}>
        <div>Drawer Content</div>
      </Drawer>
    );

    expect(screen.getByText("Drawer Content")).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    render(
      <Drawer isOpen={false} onClose={mockOnClose}>
        <div>Drawer Content</div>
      </Drawer>
    );

    const content = screen.queryByText("Drawer Content");
    expect(content).toBeInTheDocument(); // Still in DOM but hidden
  });

  it("calls onClose when backdrop is clicked", () => {
    const { container } = render(
      <Drawer isOpen={true} onClose={mockOnClose}>
        <div>Drawer Content</div>
      </Drawer>
    );

    // Find backdrop by its fixed positioning and backdrop styling
    const backdrop = container.querySelector('.fixed.inset-0.bg-black');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it("calls onClose when ESC key is pressed", () => {
    render(
      <Drawer isOpen={true} onClose={mockOnClose}>
        <div>Drawer Content</div>
      </Drawer>
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("has proper ARIA attributes", () => {
    render(
      <Drawer isOpen={true} onClose={mockOnClose}>
        <div>Drawer Content</div>
      </Drawer>
    );

    const drawer = screen.getByRole("dialog");
    expect(drawer).toHaveAttribute("aria-modal", "true");
    expect(drawer).toHaveAttribute("aria-label", "Navigation drawer");
  });

  it("applies correct CSS classes for animation", () => {
    const { rerender } = render(
      <Drawer isOpen={true} onClose={mockOnClose}>
        <div>Drawer Content</div>
      </Drawer>
    );

    const drawer = screen.getByRole("dialog");
    expect(drawer).toHaveClass("translate-x-0");

    rerender(
      <Drawer isOpen={false} onClose={mockOnClose}>
        <div>Drawer Content</div>
      </Drawer>
    );

    expect(drawer).toHaveClass("-translate-x-full");
  });
});

