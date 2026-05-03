import "@testing-library/jest-dom";

// Stub CSS imports (components import Page.css — not needed in test env)
vi.mock("../../client/src/view/Page.css", () => ({}));

// Stub image/asset imports
vi.mock("../../client/src/assets/logo.png", () => ({ default: "logo.png" }));
vi.mock("../../client/src/assets/XyonLogo.png", () => ({ default: "XyonLogo.png" }));

// Stub FullCalendar (heavyweight external component — not needed for unit tests)
vi.mock("@fullcalendar/react",       () => ({ default: () => null }));
vi.mock("@fullcalendar/daygrid",     () => ({}));
vi.mock("@fullcalendar/timegrid",    () => ({}));
vi.mock("@fullcalendar/interaction", () => ({}));

// Provide a minimal localStorage implementation (jsdom already provides one)
Object.defineProperty(window, "localStorage", {
  value: (() => {
    let store = {};
    return {
      getItem:    (k) => store[k] ?? null,
      setItem:    (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear:      () => { store = {}; },
    };
  })(),
  writable: true,
});

// Silence console.error during tests to keep output clean
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  console.error.mockRestore?.();
  localStorage.clear();
});
