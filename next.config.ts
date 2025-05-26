import type { NextConfig } from "next";
import fs from "fs";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '', // Kosongkan jika menggunakan port default (443 untuk https)
        pathname: '/c-01-450604/**', // Sesuaikan dengan path bucket Anda jika ingin lebih spesifik
                                     // Atau gunakan '/**' jika ingin mengizinkan semua path di hostname tersebut
      },
      // Anda bisa menambahkan pola lain di sini jika ada sumber gambar eksternal lain
      // {
      //   protocol: 'https',
      //   hostname: 'another-domain.com',
      // },
    ],
  },
};

export default nextConfig;
