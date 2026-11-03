export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'] },
      colors: {
        fog: '#E6EBEF', ink: '#16222C', slate2: '#5B6B78', line: '#C9D2D9',
        ok: '#2F7D55', warn: '#B7791F', threat: '#C0392B', iso: '#3B5B7A',
      },
    },
  },
  plugins: [],
};
