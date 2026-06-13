/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base:      '#07091A',
        surface:   '#0D1025',
        elevated:  '#131630',
        border:    '#1E2445',
        ring:      '#2A3260',
        primary: {
          DEFAULT: '#4F8EF7',
          dark:    '#3B7AE4',
          light:   '#7AADFF',
        },
        accent: {
          DEFAULT: '#F5A623',
          dark:    '#D98E14',
          light:   '#FFB94A',
        },
        success:  '#22C55E',
        warning:  '#F59E0B',
        danger:   '#EF4444',
        ink: {
          DEFAULT: '#E8EDF8',
          muted:   '#8B9CC8',
          faint:   '#4B5680',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body:    ['Plus Jakarta Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231E2445' fill-opacity='0.4'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'radial-blue': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(79,142,247,0.15), transparent)',
        'radial-amber': 'radial-gradient(ellipse 40% 30% at 80% 80%, rgba(245,166,35,0.08), transparent)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'slide-in':   'slideIn 0.3s ease-out',
        'glow':       'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(16px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideIn: { from: { transform: 'translateX(-16px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        glow:    { from: { boxShadow: '0 0 20px rgba(79,142,247,0.1)' }, to: { boxShadow: '0 0 40px rgba(79,142,247,0.3)' } },
      },
      boxShadow: {
        'card':     '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'elevated': '0 4px 16px rgba(0,0,0,0.5)',
        'glow-sm':  '0 0 12px rgba(79,142,247,0.25)',
        'glow-md':  '0 0 24px rgba(79,142,247,0.35)',
        'glow-accent': '0 0 20px rgba(245,166,35,0.25)',
      },
    },
  },
  plugins: [],
};
