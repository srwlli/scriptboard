import { render, screen, fireEvent } from "@testing-library/react";
import { DrawerNavigation } from "@/components/DrawerNavigation";
import { usePathname } from "next/navigation";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

describe("DrawerNavigation", () => {
  const mockOnClose = jest.fn();
  const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

  beforeEach(() => {
    mockOnClose.mockClear();
    mockUsePathname.mockReturnValue("/");
  });

  it("renders navigation items", () => {
    render(<DrawerNavigation isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("New Page")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("highlights active route", () => {
    mockUsePathname.mockReturnValue("/");
    const { rerender } = render(
      <DrawerNavigation isOpen={true} onClose={mockOnClose} />
    );

    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveClass("bg-primary");

    mockUsePathname.mockReturnValue("/settings");
    rerender(<DrawerNavigation isOpen={true} onClose={mockOnClose} />);

    const settingsLink = screen.getByText("Settings").closest("a");
    expect(settingsLink).toHaveClass("bg-primary");
  });

  it("calls onClose when navigation item is clicked", () => {
    render(<DrawerNavigation isOpen={true} onClose={mockOnClose} />);

    const homeLink = screen.getByText("Home").closest("a");
    if (homeLink) {
      fireEvent.click(homeLink);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it("renders correct icons for each item", () => {
    const { container } = render(<DrawerNavigation isOpen={true} onClose={mockOnClose} />);

    // Icons are rendered as SVG elements from lucide-react
    const svgIcons = container.querySelectorAll("svg");
    expect(svgIcons.length).toBeGreaterThanOrEqual(3); // At least 3 icons (Home, Layout, Settings)
  });

  it("has proper Link components", () => {
    render(<DrawerNavigation isOpen={true} onClose={mockOnClose} />);

    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveAttribute("href", "/");

    const newPageLink = screen.getByText("New Page").closest("a");
    expect(newPageLink).toHaveAttribute("href", "/new-page");

    const settingsLink = screen.getByText("Settings").closest("a");
    expect(settingsLink).toHaveAttribute("href", "/settings");
  });
});

