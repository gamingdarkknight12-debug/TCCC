/** @type {import('next').NextConfig} */
const nextConfig = {
  // tesseract.js spawns a Node worker_thread pointing at its own worker-script
  // file by relative path. Left to webpack, that file gets bundled into .next/
  // and the relative path breaks (MODULE_NOT_FOUND inside the worker thread,
  // which silently hangs the OCR request instead of failing fast). Excluding
  // it from the server bundle keeps it a normal node_modules require so the
  // path resolution stays correct.
  experimental: {
    serverComponentsExternalPackages: ['tesseract.js'],
  },
};
module.exports = nextConfig;
