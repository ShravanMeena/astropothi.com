export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    screens: { xs: '400px', sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
    extend: {
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        deva:  ['"Noto Sans Devanagari"', 'Inter', 'sans-serif']
      },
      // Semantic tokens so one set of classes serves both themes.
      colors: {
        surface:  'rgb(var(--surface) / <alpha-value>)',
        raised:   'rgb(var(--raised) / <alpha-value>)',
        sunken:   'rgb(var(--sunken) / <alpha-value>)',
        line:     'rgb(var(--line) / <alpha-value>)',
        fg:       'rgb(var(--fg) / <alpha-value>)',
        muted:    'rgb(var(--muted) / <alpha-value>)',
        faint:    'rgb(var(--faint) / <alpha-value>)',
        brass:    'rgb(var(--brass) / <alpha-value>)',
        brassSoft:'rgb(var(--brass-soft) / <alpha-value>)',
        ember:    'rgb(var(--ember) / <alpha-value>)'
      },
      maxWidth: { shell: '1180px', prose2: '640px' },
      boxShadow: {
        soft: '0 1px 2px rgb(var(--shadow) / .05), 0 14px 36px -18px rgb(var(--shadow) / .18)',
        lift: '0 2px 8px rgb(var(--shadow) / .07), 0 40px 80px -32px rgb(var(--shadow) / .38)',
        book: '0 40px 90px -30px rgb(var(--shadow) / .55)'
      },
      letterSpacing: { tightest: '-.03em' }
    }
  },
  plugins: []
}
