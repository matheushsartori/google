import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#137fec",
                "background-light": "#f6f7f8",
                "background-dark": "#101922",
                "card-dark": "#171e27",
                "sidebar-dark": "#0a0f14",
                "wa-dark": "#0b141a",
                "wa-panel": "#202c33",
                "wa-bubble": "#005c4b",
                "wa-bubble-other": "#202c33",
                "whatsapp-dark": "#0b141a", // Keeping alias for safety
                "chat-bubble-received": "#202c33",
                "chat-bubble-sent": "#005c4b",

                // Mantendo compatibilidade com código anterior se houver
                slate: {
                    800: "#1e293b",
                    900: "#0f172a",
                }
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"],
                "sans": ["Inter", "sans-serif"],
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
            },
        },
    },
    plugins: [],
};
export default config;
