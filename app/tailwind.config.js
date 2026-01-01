/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "rgba(255, 255, 255, 0.1)",
        input: "rgba(255, 255, 255, 0.1)",
        ring: "rgba(139, 92, 246, 0.5)",
        background: "#0a0a0f",
        foreground: "#ffffff",
        primary: {
          DEFAULT: "#8b5cf6",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "rgba(139, 92, 246, 0.1)",
          foreground: "#e9d5ff",
        },
        muted: {
          DEFAULT: "rgba(255, 255, 255, 0.05)",
          foreground: "rgba(255, 255, 255, 0.6)",
        },
        accent: {
          DEFAULT: "rgba(139, 92, 246, 0.2)",
          foreground: "#e9d5ff",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "rgba(15, 15, 25, 0.8)",
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'web3-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
        'web3-gradient-subtle': 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'gradient': 'gradient 15s ease infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        shimmer: {
          '0%': {
            'background-position': '-1000px 0'
          },
          '100%': {
            'background-position': '1000px 0'
          },
        },
      },
    },
  },
  plugins: [],
}
