import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
    const frontendPort = Number(process.env.VITE_FRONTEND_PORT) || 3000
    const backendTarget = process.env.VITE_BACKEND_TARGET || 'http://127.0.0.1:3001'

    return {
        plugins: [react()],
        server: {
            port: frontendPort,
            proxy: {
                '/api': {
                    target: backendTarget,
                    changeOrigin: true,
                }
            }
        }
    }
})
