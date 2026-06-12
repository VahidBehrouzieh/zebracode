import { NextConfig } from 'next';

const config: NextConfig = {
    output: 'export', // این خط حیاتی است: برای هاست بدون Node.js
    trailingSlash: true,
    images: {
        unoptimized: true, // هاست استاتیک نمی‌تواند تصاویر را بهینه کند
    },
    typescript: { ignoreBuildErrors: true },
    eslint: { ignoreDuringBuilds: true },
};

export default config;