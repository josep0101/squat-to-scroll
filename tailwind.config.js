/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./index.tsx",
        "./App.tsx",
        "./types.ts",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./utils/**/*.{js,ts,jsx,tsx}",
        "./public/**/*.html",
    ],
    // Safelist classes that use arbitrary values or are constructed dynamically
    safelist: [
        // Gradients with specific colors
        'from-[#FF8C00]',
        'via-[#ae4641]',
        'to-[#4B0082]',
        'bg-gradient-to-b',
        'bg-gradient-to-br',
        'bg-gradient-to-r',
        // Background colors
        'bg-[#FF8C00]',
        'bg-[#4B0082]',
        'bg-[#231a0f]',
        'bg-[#27272a]',
        'bg-black/20',
        'bg-black/30',
        'bg-black/40',
        'bg-black/50',
        'bg-black/60',
        'bg-black/80',
        'bg-white/10',
        'bg-white/20',
        'bg-white/30',
        // Text colors
        'text-[#ff8c00]',
        'text-[#00ff9d]',
        'text-[#ff4d4d]',
        'text-accent-green',
        'text-accent-red',
        // Fill colors
        'fill-[#ff8c00]',
        // Border colors
        'border-white/20',
        'border-white/30',
        // Shadows
        'shadow-neubrutalism',
        'shadow-neubrutalism-sm',
        'shadow-neubrutalism-white',
        'shadow-neu-soft',
        'shadow-neu-hard',
        'shadow-glow-green',
        // Animations
        'animate-fade-out',
        'animate-expand-bg',
        'animate-slide-down',
        'animate-slide-up',
        'animate-pulse-green',
        'animate-pop-in',
        'animate-float',
        'animate-pulse',
        // Backdrop
        'backdrop-blur-sm',
        'backdrop-blur-md',
        'backdrop-blur-lg',
        'backdrop-blur-xl',
        // Sizing
        'h-screen',
        'w-screen',
        'min-h-screen',
        // Fonts
        'font-display',
        'font-body',
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#ff8c00",
                secondary: "#4B0082",
                "background-light": "#f8f7f5",
                "background-dark": "#231a0f",
                "surface-dark": "#27272a",
                "accent-green": "#00ff9d",
                "accent-red": "#ff4d4d",
                success: "#00C853",
            },
            fontFamily: {
                display: ["Lexend", "sans-serif"],
                body: ["Noto Sans", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "1rem",
                lg: "1.5rem",
                xl: "2rem",
                "2xl": "2.5rem",
                "3xl": "3rem",
                full: "9999px",
            },
            boxShadow: {
                neubrutalism: "4px 4px 0px 0px rgba(0, 0, 0, 1)",
                "neubrutalism-sm": "2px 2px 0px 0px rgba(0, 0, 0, 1)",
                "neubrutalism-white": "4px 4px 0px 0px rgba(255, 255, 255, 1)",
                "neu-soft": "0 8px 30px rgba(0,0,0,0.5)",
                "neu-hard": "4px 4px 0px 0px rgba(255,255,255,0.1)",
                "glow-green": "0 0 30px -5px rgba(0, 255, 157, 0.6)",
            },
            animation: {
                "fade-out": "fade-out 0.5s ease-out forwards",
                "expand-bg": "expand-bg 0.8s ease-in-out forwards",
                "slide-down": "slideDown 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
                "slide-up": "slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
                "pulse-green": "pulseGreen 2s infinite",
                "pop-in": "pop-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                float: "float 3s ease-in-out infinite",
            },
            keyframes: {
                "fade-out": {
                    "0%": { opacity: "1", transform: "scale(1)" },
                    "100%": { opacity: "0", transform: "scale(0.95)" },
                },
                "expand-bg": {
                    "0%": { transform: "scale(1)" },
                    "100%": { transform: "scale(1.5)" },
                },
                slideDown: {
                    "0%": { transform: "translateY(-100%)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                slideUp: {
                    "0%": { transform: "translateY(100%)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                pulseGreen: {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.6" },
                },
                "pop-in": {
                    "0%": { transform: "scale(0.5)", opacity: "0" },
                    "100%": { transform: "scale(1)", opacity: "1" },
                },
                float: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-5px)" },
                },
            },
        },
    },
    plugins: [],
}
