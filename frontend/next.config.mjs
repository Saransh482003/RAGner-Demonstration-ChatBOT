/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  devIndicators: {
    appIsrStatus: false, // Hides the static indicator
    buildActivity: false, // Hides the compiling indicator
  },
};

export default nextConfig;
