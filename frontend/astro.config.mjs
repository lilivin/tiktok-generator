// @ts-check
import { defineConfig } from 'astro/config';
import { resolve } from 'path';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': resolve('./src')
      }
    }
  }
});