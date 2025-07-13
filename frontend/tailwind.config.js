/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        sans: ["Inter", "sans-serif"]
      },
      colors: {
        // Brand colors
        "brand-green": "#2EC57D",
        "brand-blue": "#3DAEFF", 
        "brand-teal": "#20C5C5",
        
        // New semantic color system
        "primary": "#2EC57D",
        "secondary": "#3DAEFF", 
        "accent": "#20C5C5",
        
        // Glass surface
        "surface-glass": "rgba(30, 32, 44, 0.24)",
        
        // Text colors for dark theme
        "light": "#E0E0E0",
        "muted": "#94a3b8",
        
        // Legacy support
        "text-high": "#F8F9FA",
        "text-muted": "rgba(248, 249, 250, 0.72)"
      },
      backdropBlur: {
        glass: "12px"
      },
      borderRadius: {
        card: "18px"
      },
      animation: {
        "gauge-fill": "gauge-fill 2s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "fade-in": "fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "progress-fill": "progress-fill 2s cubic-bezier(0.4, 0, 0.2, 1) forwards"
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(ellipse at top, #1C1330 0%, #131A2C 100%)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}