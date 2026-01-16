/** @type {import('next').NextConfig} */
  const nextConfig = {
    webpack: (config, { isServer }) => {
      // Exclude canvas from client-side bundle
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          canvas: false,
          fs: false,
        };
      }

      // Ignore pdfjs-dist canvas dependency warnings
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'canvas',
      });

      return config;
    },
  };

  export default nextConfig;
