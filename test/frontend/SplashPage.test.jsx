/**
 * SplashPage Component Tests
 */
import { render, screen, fireEvent } from "@testing-library/react";
import SplashPage from "../../client/src/view/SplashPage";

describe("SplashPage", () => {
  const onShowLogin  = vi.fn();
  const onShowSignup = vi.fn();

  const renderSplash = () =>
    render(<SplashPage onShowLogin={onShowLogin} onShowSignup={onShowSignup} />);

  beforeEach(() => {
    onShowLogin.mockClear();
    onShowSignup.mockClear();
  });

  // ── Rendering ────────────────────────────────────────────────────────────

  test("renders without crashing", () => {
    renderSplash();
    expect(document.body).toBeTruthy();
  });

  test("renders the Xyon logo image", () => {
    renderSplash();
    expect(screen.getByAltText("Xyon Logo")).toBeInTheDocument();
  });

  test("renders the hero headline", () => {
    renderSplash();
    expect(screen.getByText(/your academic life/i)).toBeInTheDocument();
  });

  test("renders the tagline text", () => {
    renderSplash();
    expect(screen.getByText(/classes, assignments, deadlines/i)).toBeInTheDocument();
  });

  test("renders a 'Get Started' call-to-action button", () => {
    renderSplash();
    expect(screen.getByText(/get started/i)).toBeInTheDocument();
  });

  test("renders 'Log In' buttons in the navbar and hero", () => {
    renderSplash();
    const loginButtons = screen.getAllByText(/log in/i);
    expect(loginButtons.length).toBeGreaterThanOrEqual(1);
  });

  test("renders 'Sign Up' button in navbar", () => {
    renderSplash();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  // ── Feature Cards ────────────────────────────────────────────────────────

  test("renders the 'Smart Calendar' feature card", () => {
    renderSplash();
    expect(screen.getByText("Smart Calendar")).toBeInTheDocument();
  });

  test("renders the 'Course Catalog' feature card", () => {
    renderSplash();
    expect(screen.getByText("Course Catalog")).toBeInTheDocument();
  });

  test("renders the 'Due Date Tracker' feature card", () => {
    renderSplash();
    expect(screen.getByText("Due Date Tracker")).toBeInTheDocument();
  });

  test("renders the 'To Do Notes' feature card", () => {
    renderSplash();
    expect(screen.getByText("To Do Notes")).toBeInTheDocument();
  });

  test("renders all four feature cards", () => {
    renderSplash();
    expect(screen.getByText("Smart Calendar")).toBeInTheDocument();
    expect(screen.getByText("Course Catalog")).toBeInTheDocument();
    expect(screen.getByText("Due Date Tracker")).toBeInTheDocument();
    expect(screen.getByText("To Do Notes")).toBeInTheDocument();
  });

  test("renders the footer 'Ready to get organized?' CTA", () => {
    renderSplash();
    expect(screen.getByText(/ready to get organized/i)).toBeInTheDocument();
  });

  // ── Interactions ─────────────────────────────────────────────────────────

  test("calls onShowLogin when the navbar 'Log In' button is clicked", () => {
    renderSplash();
    const loginBtn = screen.getAllByRole("button", { name: /log in/i })[0];
    fireEvent.click(loginBtn);
    expect(onShowLogin).toHaveBeenCalledTimes(1);
  });

  test("calls onShowSignup when the navbar 'Sign Up' button is clicked", () => {
    renderSplash();
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    expect(onShowSignup).toHaveBeenCalledTimes(1);
  });

  test("calls onShowSignup when the hero 'Get Started' button is clicked", () => {
    renderSplash();
    fireEvent.click(screen.getByText(/get started/i));
    expect(onShowSignup).toHaveBeenCalledTimes(1);
  });

  test("calls onShowSignup when the footer 'Create your account' button is clicked", () => {
    renderSplash();
    fireEvent.click(screen.getByText(/create your account/i));
    expect(onShowSignup).toHaveBeenCalledTimes(1);
  });

  // ── Dark mode toggle ─────────────────────────────────────────────────────

  test("renders a dark/light mode toggle button", () => {
    renderSplash();
    const moonBtn = document.querySelector("button[title]");
    expect(moonBtn).toBeInTheDocument();
  });

  test("toggles dark mode when the moon/sun button is clicked", () => {
    renderSplash();
    const moonBtn = document.querySelector("button[title]");
    // Default is light mode (no dark mode in localStorage)
    fireEvent.click(moonBtn);
    expect(localStorage.getItem("xyon-dark-mode")).toBe("true");
    fireEvent.click(moonBtn);
    expect(localStorage.getItem("xyon-dark-mode")).toBe("false");
  });
});
