export const getServerUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://your-production-url.railway.app'; // Replace with your actual Railway URL
  }
  return 'http://localhost:3000';
};