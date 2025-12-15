import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          // 将第三方库分离到单独的chunk
          vendor: ['lucide-react'],
          // 将工具类分离
          utils: ['js/store', 'js/api', 'js/prompt-generator'],
          // 将组件分离
          components: ['js/components/theme-selector', 'js/components/vocabulary-editor']
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const extType = info[info.length - 1]
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
            return `assets/media/[name]-[hash].${extType}`
          }
          if (/\.(png|jpe?g|gif|svg)(\?.*)?$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${extType}`
          }
          if (extType === 'css') {
            return `assets/styles/[name]-[hash].${extType}`
          }
          return `assets/[name]-[hash].${extType}`
        }
      }
    },
    // 启用源码映射（生产环境关闭）
    sourcemap: process.env.NODE_ENV === 'development'
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  plugins: [
    // 可以添加更多插件，如图片压缩、CSS 预处理等
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './')
    }
  },
  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  }
})