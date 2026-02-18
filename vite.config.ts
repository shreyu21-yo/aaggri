
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Use '.' instead of process.cwd() to resolve the environment directory and avoid TS errors regarding the 'process' object.
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      'process.env': {
        API_KEY: JSON.stringify(env.VITE_API_KEY || env.API_KEY || '')
      }
    }
  };
});
