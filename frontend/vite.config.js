import { randomUUID } from 'node:crypto'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const LAUNCHER_HEALTH_PATH = '/__launcher/health'

function normalizeBackendTarget(value) {
    return String(value).replace(/\/+$/, '')
}

export function createLauncherIdentityPlugin({ frontendPort, backendTarget }) {
    const identity = Object.freeze({
        ok: true,
        project: 'tennis-decision-ui',
        service: 'frontend',
        instanceId: randomUUID(),
        pid: process.pid,
        startedAt: new Date().toISOString(),
        frontendPort,
        backendTarget,
    })
    const payload = JSON.stringify(identity)

    return {
        name: 'tennis-decision-ui-launcher-identity',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const pathname = new URL(
                    req.url || '/',
                    'http://127.0.0.1',
                ).pathname

                if (pathname !== LAUNCHER_HEALTH_PATH) {
                    next()
                    return
                }

                if ((req.method || 'GET').toUpperCase() !== 'GET') {
                    res.statusCode = 405
                    res.setHeader('Allow', 'GET')
                    res.setHeader('Cache-Control', 'no-store')
                    res.end()
                    return
                }

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.setHeader('Cache-Control', 'no-store')
                res.end(payload)
            })
        },
    }
}

export default defineConfig(() => {
    const configuredPort = Number(process.env.VITE_FRONTEND_PORT)
    const frontendPort = (
        Number.isInteger(configuredPort) && configuredPort > 0
            ? configuredPort
            : 3000
    )
    const backendTarget = normalizeBackendTarget(
        process.env.VITE_BACKEND_TARGET || 'http://127.0.0.1:3001',
    )

    return {
        plugins: [
            react(),
            createLauncherIdentityPlugin({ frontendPort, backendTarget }),
        ],
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
