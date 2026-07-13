/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0f172a', // Slate-900
                surface: '#1e293b',    // Slate-800
                surfaceHighlight: '#334155', // Slate-700
                primary: '#3b82f6',    // Blue-500
                accent: '#22c55e',     // Green-500
                textMain: '#f8fafc',   // Slate-50
                textMuted: '#94a3b8',  // Slate-400
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            }
        },
    },
    plugins: [],
}
