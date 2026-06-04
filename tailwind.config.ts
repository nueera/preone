import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'var(--font-inter)', 'sans-serif'],
        display: ['Outfit', 'Poppins', 'sans-serif'],
        mono: ['JetBrains Mono', 'var(--font-geist-mono)', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['clamp(1.5rem, 2vw, 1.875rem)', { lineHeight: '2.25rem' }],
        '4xl': ['clamp(1.875rem, 3vw, 2.25rem)', { lineHeight: '2.5rem' }],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        chart: {
          '1': 'var(--chart-1)',
          '2': 'var(--chart-2)',
          '3': 'var(--chart-3)',
          '4': 'var(--chart-4)',
          '5': 'var(--chart-5)',
        },
        /** Portal-scoped colors */
        portal: {
          DEFAULT: 'var(--portal)',
          foreground: 'var(--portal-foreground)',
          50: 'var(--portal-50)',
          100: 'var(--portal-100)',
          200: 'var(--portal-200)',
          300: 'var(--portal-300)',
          400: 'var(--portal-400)',
          500: 'var(--portal-500)',
          600: 'var(--portal-600)',
          700: 'var(--portal-700)',
          800: 'var(--portal-800)',
          900: 'var(--portal-900)',
        },
        /** PreOne Cosmic colors */
        preone: {
          primary: 'var(--preone-primary)',
          'primary-dark': 'var(--preone-primary-dark)',
          'primary-light': 'var(--preone-primary-light)',
          'primary-50': 'var(--preone-primary-50)',
          'primary-100': 'var(--preone-primary-100)',
          blue: 'var(--preone-blue)',
          orange: 'var(--preone-orange)',
          pink: 'var(--preone-pink)',
          green: 'var(--preone-green)',
          coral: 'var(--preone-coral)',
        },
        /** Cosmic text colors */
        cosmic: {
          'text-primary': 'var(--text-primary)',
          'text-secondary': 'var(--text-secondary)',
          'text-tertiary': 'var(--text-tertiary)',
          'text-muted': 'var(--text-muted)',
          'bg-primary': 'var(--bg-primary)',
          'bg-secondary': 'var(--bg-secondary)',
          'bg-tertiary': 'var(--bg-tertiary)',
          'border-default': 'var(--border-default)',
          'border-light': 'var(--border-light)',
        },
      },
      screens: {
        'xs': '475px',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
        xl: '20px',
        '2xl': '24px',
        '3xl': '28px',
        '4xl': '32px',
        card: '24px',
        container: '20px',
        element: '16px',
        badge: '12px',
      },
      boxShadow: {
        card: '0px 8px 24px rgba(15,23,42,0.06)',
        'card-hover': '0px 20px 40px rgba(15,23,42,0.08)',
        floating: '0px 30px 60px rgba(15,23,42,0.10)',
        portal: '0px 8px 24px rgba(15,23,42,0.06)',
        glow: '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow-dark': '0 0 20px rgba(108, 92, 231, 0.25)',
        'hero': '0 10px 25px rgba(99, 102, 241, 0.25)',
        'hero-dark': '0 10px 25px rgba(108, 92, 231, 0.35)',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'aurora-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(99, 102, 241, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' },
        },
      },
      animation: {
        twinkle: 'twinkle 3s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        'aurora-shift': 'aurora-shift 15s ease infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;
