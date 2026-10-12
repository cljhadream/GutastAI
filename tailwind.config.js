/** @type {import('tailwindcss').Config} */
export default {
  // Class-based dark mode: the page toggles a local `dark` wrapper class for
  // its independent theme switch (defaults to the OS preference).
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Hyper Energy" palette
        hyper: {
          orange: '#FF5E1E',     // Ignition orange (primary accent)
          orangeGlow: '#FF7A00', // Gradient relay / corona gold
          amber: '#FFB800',      // Highlight marker (HOT, 5X)
          indigo: '#6366F1',     // Claude Code tech force
          violet: '#8B5CF6',     // Gradient tail
          darkBg: '#06070B',     // Dark page base
          darkCard: '#0D0F17',   // Dark card surface
          darkBorder: '#1F2436', // Dark border
          lightBg: '#F8FAFC',    // Light page base
          lightCard: '#FFFFFF',  // Light card surface
          lightBorder: '#E2E8F0' // Light border
        },
        // WeCom (企业微信) brand green: instant "WeChat ecosystem" recognition
        // for contact CTAs, kept separate from the orange purchase CTAs.
        wechat: {
          DEFAULT: '#07C160', // WeChat brand green
          dark: '#06AD56'     // Gradient relay / hover base
        },
      },
      boxShadow: {
        // Elevation glows
        'glow-orange': '0 0 35px -5px rgba(255, 94, 30, 0.45)',
        'glow-orange-lg': '0 0 50px -5px rgba(255, 94, 30, 0.65)',
        'glow-card': '0 0 30px -10px rgba(99, 102, 241, 0.25)',
        // WeCom CTA glows
        'glow-wechat': '0 0 22px -5px rgba(7, 193, 96, 0.5)',
        'glow-wechat-lg': '0 0 32px -5px rgba(7, 193, 96, 0.65)',
        'cyber': '0 10px 40px -10px rgba(0, 0, 0, 0.5)'
      },
    },
  },
  plugins: [],
}
