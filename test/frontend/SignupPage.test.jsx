/**
 * SignupPage Component Tests
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupPage from "../../client/src/view/SignupPage";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("SignupPage", () => {
  const onSignupSuccess = vi.fn();
  const onShowLogin     = vi.fn();
  const onShowSplash    = vi.fn();

  const renderSignup = () =>
    render(
      <SignupPage
        onSignupSuccess={onSignupSuccess}
        onShowLogin={onShowLogin}
        onShowSplash={onShowSplash}
      />
    );

  beforeEach(() => {
    onSignupSuccess.mockClear();
    onShowLogin.mockClear();
    mockFetch.mockClear();
  });

  // ── Rendering ────────────────────────────────────────────────────────────

  test("renders without crashing", () => {
    renderSignup();
    expect(document.body).toBeTruthy();
  });

  test("renders 'Sign Up' heading", () => {
    renderSignup();
    expect(screen.getByRole("heading", { name: /sign up/i })).toBeInTheDocument();
  });

  test("renders 'First Name' input", () => {
    renderSignup();
    expect(screen.getByPlaceholderText(/first name/i)).toBeInTheDocument();
  });

  test("renders 'Last Name' input", () => {
    renderSignup();
    expect(screen.getByPlaceholderText(/last name/i)).toBeInTheDocument();
  });

  test("renders 'Email' input", () => {
    renderSignup();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });

  test("renders 'Password' input", () => {
    renderSignup();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  test("renders the 'Sign Up' submit button", () => {
    renderSignup();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  test("renders the 'Already have an account? Log in' link", () => {
    renderSignup();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  test("password input type is 'password'", () => {
    renderSignup();
    expect(screen.getByPlaceholderText(/password/i)).toHaveAttribute("type", "password");
  });

  // ── Form Input ───────────────────────────────────────────────────────────

  test("updates First Name field when typed in", async () => {
    renderSignup();
    const input = screen.getByPlaceholderText(/first name/i);
    await userEvent.type(input, "Samuel");
    expect(input.value).toBe("Samuel");
  });

  test("updates Last Name field when typed in", async () => {
    renderSignup();
    const input = screen.getByPlaceholderText(/last name/i);
    await userEvent.type(input, "Reyes");
    expect(input.value).toBe("Reyes");
  });

  test("updates Email field when typed in", async () => {
    renderSignup();
    const input = screen.getByPlaceholderText(/email/i);
    await userEvent.type(input, "student@montclair.edu");
    expect(input.value).toBe("student@montclair.edu");
  });

  test("updates Password field when typed in", async () => {
    renderSignup();
    const input = screen.getByPlaceholderText(/password/i);
    await userEvent.type(input, "SecurePass123");
    expect(input.value).toBe("SecurePass123");
  });

  // ── Successful Signup ────────────────────────────────────────────────────

  test("shows a success message after a successful registration response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, user_id: 42 }),
    });

    renderSignup();
    await userEvent.type(screen.getByPlaceholderText(/first name/i), "Samuel");
    await userEvent.type(screen.getByPlaceholderText(/last name/i),  "Reyes");
    await userEvent.type(screen.getByPlaceholderText(/email/i),      "sam@montclair.edu");
    await userEvent.type(screen.getByPlaceholderText(/password/i),   "MyPass123!");

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() =>
      expect(screen.getByText(/signup successful/i)).toBeInTheDocument()
    );
  });

  test("sends first_name, last_name, email, and password in the request body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, user_id: 42 }),
    });

    renderSignup();
    await userEvent.type(screen.getByPlaceholderText(/first name/i), "Samuel");
    await userEvent.type(screen.getByPlaceholderText(/last name/i),  "Reyes");
    await userEvent.type(screen.getByPlaceholderText(/email/i),      "sam@montclair.edu");
    await userEvent.type(screen.getByPlaceholderText(/password/i),   "MyPass123!");

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.first_name).toBe("Samuel");
    expect(body.last_name).toBe("Reyes");
    expect(body.email).toBe("sam@montclair.edu");
    expect(body.password).toBe("MyPass123!");
  });

  test("posts to /api/auth/register endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, user_id: 42 }),
    });

    renderSignup();
    await userEvent.type(screen.getByPlaceholderText(/first name/i), "Sam");
    await userEvent.type(screen.getByPlaceholderText(/last name/i),  "R");
    await userEvent.type(screen.getByPlaceholderText(/email/i),      "s@test.com");
    await userEvent.type(screen.getByPlaceholderText(/password/i),   "pass123");

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(mockFetch.mock.calls[0][0]).toMatch(/\/api\/auth\/register/);
  });

  // ── Failed Signup ─────────────────────────────────────────────────────────

  test("shows an error message when the email is already taken", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: "Email already exists." }),
    });

    renderSignup();
    await userEvent.type(screen.getByPlaceholderText(/first name/i), "Sam");
    await userEvent.type(screen.getByPlaceholderText(/last name/i),  "R");
    await userEvent.type(screen.getByPlaceholderText(/email/i),      "duplicate@test.com");
    await userEvent.type(screen.getByPlaceholderText(/password/i),   "Pass123!");

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() =>
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
    );
    expect(onSignupSuccess).not.toHaveBeenCalled();
  });

  test("shows an error message when the network request fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network failure"));

    renderSignup();
    await userEvent.type(screen.getByPlaceholderText(/first name/i), "Sam");
    await userEvent.type(screen.getByPlaceholderText(/last name/i),  "R");
    await userEvent.type(screen.getByPlaceholderText(/email/i),      "sam@test.com");
    await userEvent.type(screen.getByPlaceholderText(/password/i),   "Pass123!");

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() =>
      expect(screen.getByText(/error occurred/i)).toBeInTheDocument()
    );
  });

  // ── Navigation ───────────────────────────────────────────────────────────

  test("calls onShowLogin when the 'Already have an account? Log in' link is clicked", () => {
    renderSignup();
    fireEvent.click(screen.getByText(/already have an account/i));
    expect(onShowLogin).toHaveBeenCalledTimes(1);
  });
});
