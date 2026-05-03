/**
 * LoginPage Component Tests
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../../client/src/view/LoginPage";

// Mock fetch globally for this suite
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("LoginPage", () => {
  const onLoginSuccess = vi.fn();
  const onShowSignup   = vi.fn();
  const onShowSplash   = vi.fn();

  const renderLogin = () =>
    render(
      <LoginPage
        onLoginSuccess={onLoginSuccess}
        onShowSignup={onShowSignup}
        onShowSplash={onShowSplash}
      />
    );

  beforeEach(() => {
    onLoginSuccess.mockClear();
    onShowSignup.mockClear();
    onShowSplash.mockClear();
    mockFetch.mockClear();
  });

  // ── Rendering ────────────────────────────────────────────────────────────

  test("renders without crashing", () => {
    renderLogin();
    expect(document.body).toBeTruthy();
  });

  test("renders the 'Login' heading", () => {
    renderLogin();
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  test("renders the email input", () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });

  test("renders the password input", () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  test("renders the 'Log in' submit button", () => {
    renderLogin();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  test("renders the 'Forgot password?' link", () => {
    renderLogin();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  test("renders the 'Don't have an account? Sign up' link", () => {
    renderLogin();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });

  // ── Form Input ───────────────────────────────────────────────────────────

  test("updates email field when typed in", async () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText(/email/i);
    await userEvent.type(emailInput, "student@montclair.edu");
    expect(emailInput.value).toBe("student@montclair.edu");
  });

  test("updates password field when typed in", async () => {
    renderLogin();
    const pwInput = screen.getByPlaceholderText(/password/i);
    await userEvent.type(pwInput, "SecurePass123");
    expect(pwInput.value).toBe("SecurePass123");
  });

  test("password input is of type 'password' (hidden text)", () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/password/i)).toHaveAttribute("type", "password");
  });

  // ── Successful Login ─────────────────────────────────────────────────────

  test("calls onLoginSuccess after a successful login response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        token: "mock.jwt.token",
        user: { user_id: 1, first_name: "Sam", last_name: "Reyes", email: "sam@test.com", role: "student" },
      }),
    });

    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/email/i), "sam@test.com");
    await userEvent.type(screen.getByPlaceholderText(/password/i), "MyPass123!");
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledTimes(1));
  });

  test("saves token and user to localStorage on successful login", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        token: "mock.jwt.token",
        user: { user_id: 1, first_name: "Sam", last_name: "Reyes", email: "sam@test.com", role: "student" },
      }),
    });

    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/email/i), "sam@test.com");
    await userEvent.type(screen.getByPlaceholderText(/password/i), "MyPass123!");
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(localStorage.getItem("token")).toBe("mock.jwt.token"));
  });

  // ── Failed Login ─────────────────────────────────────────────────────────

  test("shows an error message on failed login", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: "Invalid email or password." }),
    });

    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/email/i), "bad@test.com");
    await userEvent.type(screen.getByPlaceholderText(/password/i), "wrong");
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() =>
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    );
    expect(onLoginSuccess).not.toHaveBeenCalled();
  });

  test("shows an error when the network request fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/email/i), "sam@test.com");
    await userEvent.type(screen.getByPlaceholderText(/password/i), "MyPass123!");
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() =>
      expect(screen.getByText(/error occurred/i)).toBeInTheDocument()
    );
  });

  // ── Forgot Password Flow ─────────────────────────────────────────────────

  test("shows the Reset Password form when 'Forgot password?' is clicked", () => {
    renderLogin();
    fireEvent.click(screen.getByText(/forgot password/i));
    expect(screen.getByText("Reset Password")).toBeInTheDocument();
    expect(screen.getByText(/send you a reset code/i)).toBeInTheDocument();
  });

  test("shows 'Send Code' button in forgot-password step", () => {
    renderLogin();
    fireEvent.click(screen.getByText(/forgot password/i));
    expect(screen.getByRole("button", { name: /send code/i })).toBeInTheDocument();
  });

  test("shows the OTP form after submitting the forgot-password email", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    });

    renderLogin();
    fireEvent.click(screen.getByText(/forgot password/i));

    const emailInput = screen.getByPlaceholderText(/email/i);
    await userEvent.type(emailInput, "sam@test.com");
    fireEvent.click(screen.getByRole("button", { name: /send code/i }));

    await waitFor(() =>
      expect(screen.getByPlaceholderText(/6-digit code/i)).toBeInTheDocument()
    );
  });

  test("'← Back to login' link returns to the login form", () => {
    renderLogin();
    fireEvent.click(screen.getByText(/forgot password/i));
    fireEvent.click(screen.getByText(/back to login/i));
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  // ── Navigation ───────────────────────────────────────────────────────────

  test("calls onShowSignup when the sign-up link is clicked", () => {
    renderLogin();
    fireEvent.click(screen.getByText(/sign up/i));
    expect(onShowSignup).toHaveBeenCalledTimes(1);
  });
});
