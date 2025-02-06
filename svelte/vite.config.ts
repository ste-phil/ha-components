import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteSingleFile } from "vite-plugin-singlefile"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        dev: true,
        customElement: true,
      },
    }),
    viteSingleFile()
  ],
  build: {
    minify: false,
    cssCodeSplit: false,
    lib: {
      entry: 'src/main.ts',
      name: 'svelte-cards',
      fileName: 'svelte-cards',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,  // Ensure dynamic imports are inlined
      },
    },
  }
})
