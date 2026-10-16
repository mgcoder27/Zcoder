export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:5000'
    : 'https://zcoder-904x.onrender.com');
