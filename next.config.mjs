/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
    
    remotePatterns: [
      // Local development
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/api/accounts/media/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/media/**' },
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/api/accounts/media/**' },
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/media/**' },
      
      // Cloudinary
      { 
        protocol: 'https', 
        hostname: 'res.cloudinary.com',
        pathname: '/**'
      },
    ],
  },
};

export default nextConfig;