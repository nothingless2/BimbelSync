import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                'primary-blue': '#2563EB',
                'accent-green': '#16A34A',
                'accent-red': '#DC2626',
                'neutral-white': '#FFFFFF',
                'soft-gray': '#F3F4F6',
            },
        },
    },
    plugins: [],
};
export default config;
