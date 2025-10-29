const nextConfig = {
    images: {
        domains: ["images.unsplash.com", "utfs.io"]
    },
    // Enable standalone output for Docker
    output: 'standalone',
}

module.exports = {
    webpack: (config) => {
        config.resolve.alias.canvas = false;

        return config;
     },
    ...nextConfig

}
