/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. 开启安全头，允许 SharedArrayBuffer
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
  // 2. 避免 ffmpeg core 加载时的某些解析错误
  reactStrictMode: false, 
};

export default nextConfig;