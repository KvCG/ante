import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    
    // Client source directory
    root: '.',
    
    // Resolve aliases
    resolve: {
        alias: {
            '@shared': path.resolve(__dirname, './src/shared'),
        },
    },
    
    // Development server configuration
    server: {
        port: 5173,
        strictPort: true,
        
        // Proxy API requests to backend during development
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
    
    // Build configuration
    build: {
        outDir: 'dist/client',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                },
            },
        },
    },
    
    // Optimize dependencies
    optimizeDeps: {
        include: ['react', 'react-dom'],
    },
})
