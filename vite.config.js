import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Two build modes:
 *   npm run build         -> normal Vercel-ready static build in /dist
 *   npm run build:single  -> one self-contained index.html in /dist-single
 *                            (handy for demos, QR codes and offline pitching)
 */
export default defineConfig(() => {
  const single = process.env.SINGLEFILE === '1';
  return {
    plugins: [react(), ...(single ? [viteSingleFile()] : [])],
    base: './',
    server: { port: 5173, host: true },
    build: {
      outDir: single ? 'dist-single' : 'dist',
      target: 'es2020',
      assetsInlineLimit: single ? 100000000 : 4096,
      cssCodeSplit: !single,
      chunkSizeWarningLimit: 1600,
    },
  };
});
