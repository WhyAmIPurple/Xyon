/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        xyon: {
          accent: "#E6ABAB",
          bg: "#f3f1ed",
          card: "#f7f5f1",
          line: "#e5e1d9",
          ink: "#1f1f1f",
          muted: "#6b6b6b",
          pill: "#e8e2d8",
          pill2: "#efe9df"
        }
      },
      boxShadow: { soft: "0 10px 25px rgba(0,0,0,0.06)" },
      borderRadius: { xxl: "20px" }
    }
  },
  plugins: []
};

