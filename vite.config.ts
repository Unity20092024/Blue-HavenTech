import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({build:{rollupOptions:{input:Object.fromEntries(['index','about','services','how-it-works','contact','privacy','terms'].map(page=>[page,resolve(process.cwd(),`${page}.html`)]))}}});
