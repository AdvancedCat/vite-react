import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const root = path.resolve(process.cwd())

const reactDist = path.join(root, './src/react-dist')

console.log(path.join(root, './src/react-dist/react'))

// https://vitejs.dev/config/
export default defineConfig({
  
  resolve: {
    // alias: {
    //   "@": path.resolve(__dirname, "src"),
    //   // 'react': reactDist + '/react',
    //   'react': path.resolve(__dirname, "src/react-dist/react"),
    //   'react-dom': reactDist + '/react-dom',
    // }
  },
  plugins: [react()],
})
