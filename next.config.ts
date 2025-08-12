import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Support legacy .html URLs
      { source: "/about.html", destination: "/about" },
      { source: "/news.html", destination: "/news" },
      { source: "/tirasi.html", destination: "/tirashi" },
      { source: "/reservation.html", destination: "/reservation" },
      { source: "/access.html", destination: "/access" },
      { source: "/contact.html", destination: "/contact" },
      { source: "/download.html", destination: "/download" },
      { source: "/price.html", destination: "/price" },
    ];
  },
};

export default nextConfig;
