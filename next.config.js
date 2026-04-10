/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google profile pictures
      'firebasestorage.googleapis.com',
    ],
  },
  // Required for nodemailer in API routes on Vercel/Netlify
  serverExternalPackages: ['nodemailer'],
};

module.exports = nextConfig;
