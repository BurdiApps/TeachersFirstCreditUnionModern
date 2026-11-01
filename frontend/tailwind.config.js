/** @type {import('tailwindcss').Config} */
export default {
  // Tailwind scans these files and includes only the utility classes they use.
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    // Keep the shared palette and fonts available as utilities throughout React.
    extend: {
      colors: {
        ink: '#17394b',
        ocean: '#1b5d83',
        mist: '#eaf2f5',
        canvas: '#f7f5f0',
        tomato: '#c84653',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 40px rgba(23, 57, 75, 0.08)',
      },
    },
  },
  plugins: [],
};
