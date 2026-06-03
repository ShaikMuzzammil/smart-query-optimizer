/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        cyber: {
          50:  '#e6ffff',
          100: '#ccfffe',
          200: '#99fffd',
          300: '#66fffc',
          400: '#33fffb',
          500: '#00d4ff',
          600: '#00aacc',
          700: '#007f99',
          800: '#005566',
          900: '#002a33',
        },
        neon: {
          blue:   '#0080ff',
          cyan:   '#00d4ff',
          purple: '#8b5cf6',
          green:  '#00ff88',
          pink:   '#ff0080',
          orange: '#ff6600',
        },
        dark: {
          50:  '#1a1a2e',
          100: '#16213e',
          200: '#0f3460',
          300: '#0d0d1a',
          400: '#090912',
          500: '#050508',
        },
      },
      fontFamily: {
        display: ['var(--font-orbitron)', 'monospace'],
        body:    ['var(--font-inter)', 'sans-serif'],
        mono:    ['var(--font-jetbrains)', 'monospace'],
        exo:     ['var(--font-exo)', 'sans-serif'],
      },
      backgroundImage: {
        'cyber-grid':
          "linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)",
        'glow-radial': 'radial-gradient(ellipse at center, rgba(0,212,255,0.15) 0%, transparent 70%)',
        'hero-gradient': 'linear-gradient(135deg, #050508 0%, #0a0a18 50%, #0d0d25 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        'primary-gradient': 'linear-gradient(135deg, #00d4ff 0%, #0080ff 100%)',
        'accent-gradient':  'linear-gradient(135deg, #8b5cf6 0%, #0080ff 100%)',
        'success-gradient': 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
      },
      backgroundSize: {
        'grid-sm': '20px 20px',
        'grid-md': '40px 40px',
        'grid-lg': '60px 60px',
      },
      animation: {
        'glow-pulse':    'glow-pulse 2s ease-in-out infinite',
        'float':         'float 6s ease-in-out infinite',
        'scan-line':     'scan-line 3s linear infinite',
        'orbit':         'orbit 4s linear infinite',
        'orbit-reverse': 'orbit 6s linear infinite reverse',
        'shimmer':       'shimmer 2s linear infinite',
        'pulse-ring':    'pulse-ring 1.5s cubic-bezier(0.215,0.61,0.355,1) infinite',
        'type-cursor':   'type-cursor 1s step-end infinite',
        'slide-up':      'slide-up 0.5s ease-out',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
        'spin-slow':     'spin 8s linear infinite',
        'counter-glow':  'counter-glow 2s ease-in-out infinite alternate',
        'matrix-fall':   'matrix-fall 20s linear infinite',
        'gradient-shift': 'gradient-shift 6s ease infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0,212,255,0.3), 0 0 20px rgba(0,212,255,0.1)' },
          '50%':      { boxShadow: '0 0 20px rgba(0,212,255,0.8), 0 0 60px rgba(0,212,255,0.3)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        'scan-line': {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        orbit: {
          '0%':   { transform: 'rotate(0deg) translateX(60px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(60px) rotate(-360deg)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%':   { transform: 'scale(0.8)', opacity: '1' },
          '80%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
        'type-cursor': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',     opacity: '1' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(8px)' },
        },
        'counter-glow': {
          '0%':   { textShadow: '0 0 10px rgba(0,212,255,0.5)' },
          '100%': { textShadow: '0 0 30px rgba(0,212,255,1), 0 0 60px rgba(0,212,255,0.5)' },
        },
        'matrix-fall': {
          '0%':   { transform: 'translateY(-100%)', opacity: '1' },
          '100%': { transform: 'translateY(100vh)',  opacity: '0' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
      },
      boxShadow: {
        'neon-blue':   '0 0 10px rgba(0,128,255,0.5),  0 0 40px rgba(0,128,255,0.2)',
        'neon-cyan':   '0 0 10px rgba(0,212,255,0.5),  0 0 40px rgba(0,212,255,0.2)',
        'neon-purple': '0 0 10px rgba(139,92,246,0.5), 0 0 40px rgba(139,92,246,0.2)',
        'neon-green':  '0 0 10px rgba(0,255,136,0.5),  0 0 40px rgba(0,255,136,0.2)',
        'card':        '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'card-hover':  '0 8px 40px rgba(0,212,255,0.15), 0 4px 24px rgba(0,0,0,0.6)',
        'inner-glow':  'inset 0 0 30px rgba(0,212,255,0.05)',
        'button':      '0 0 20px rgba(0,212,255,0.4), 0 4px 15px rgba(0,0,0,0.3)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
