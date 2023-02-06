import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // resolve: {
  //   alias: {
  //     'react': './react-dist/react',
  //     'react-dom': './react-dist/react-dom',
  //   }
  // }
})
