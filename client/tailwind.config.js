/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        xyon: {
          accent: "var(--xyon-accent)",
          bg:     "var(--xyon-bg)",
          card:   "var(--xyon-card)",
          panel:  "var(--xyon-panel)",
          past:   "var(--xyon-past)",
          line:   "var(--xyon-line)",
          // ink uses RGB tuple so opacity modifiers (bg-xyon-ink/50) work
          ink:    "rgb(var(--xyon-ink-rgb) / <alpha-value>)",
          muted:  "var(--xyon-muted)",
          pill:   "var(--xyon-pill)",
          pill2:  "var(--xyon-pill2)",
        }
      },
      boxShadow: { soft: "0 10px 25px rgba(0,0,0,0.06)" },
      borderRadius: { xxl: "20px" }
    }
  },
  plugins: []
};
