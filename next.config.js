// For building on vercel: https://github.com/Automattic/node-canvas/issues/1779
if (
  !process.env.LD_LIBRARY_PATH ||
  !process.env.LD_LIBRARY_PATH.includes(
    `${process.env.PWD}/node_modules/canvas/build/Release:`
  )
) {
  process.env.LD_LIBRARY_PATH = `${
    process.env.PWD
  }/node_modules/canvas/build/Release:${process.env.LD_LIBRARY_PATH || ''}`
}

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  env: {
    BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
    BASE_CLUSTER: process.env.BASE_CLUSTER || 'devnet',
  },
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /awesome-qr/,
        })
      )
    }
    return config
  },
}
