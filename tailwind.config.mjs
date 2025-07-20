import animate from 'tailwindcss-animate'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './app/(landing)/**/*.{js,ts,jsx,tsx}',
    './app/(main)/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['var(--font-inter)'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
        ring: 'hsl(var(--ring))',
        accent: 'hsl(var(--accent))',
      },
    },
  },
  plugins: [animate],
}
