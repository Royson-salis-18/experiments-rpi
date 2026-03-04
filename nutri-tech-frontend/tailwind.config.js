export default {
    content: ["./index.html", "./src/**/*.{js, jsx}"],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "brand-green": "#1E6F5C",
                "brand-gold": "#CBBE9A",
                "brand-accent": "#2ECC71",
                "brand-black": "#0E0F0D",
                "brand-surface": "#161815",
                "text-secondary": "#A7A7A7",

                // Dashboard Specific
                "dashboard-bg": "#0F110E",
                "dashboard-surface": "#141A13",
                "dashboard-card": "#1A2418",
                "dashboard-accent": "#3DFF6A",
                "dashboard-text-muted": "#9BA59B",
                "dashboard-warning": "#E6B85C",
                "dashboard-danger": "#FF6B6B",
            },
            fontFamily: {
                "sans": ["Inter", "sans-serif"],
                "serif": ["Playfair Display", "serif"],
            },
            borderRadius: {
                "DEFAULT": "1rem",
                "sm": "8px",
                "md": "12px",
                "lg": "16px",
                "xl": "24px",
                "2xl": "16px", // Mapping to 16px to fix current usage in Dashboard widgets
                "3xl": "24px",
                "full": "9999px"
            },
        },
    },
};