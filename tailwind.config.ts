import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* Font Families - Mapped to Design Tokens */
      fontFamily: {
        display: "var(--font-family-display)",
        body: "var(--font-family-body)",
        sans: "var(--font-family-body)",
        serif: "var(--font-family-display)",
      },

      /* Font Sizes - Mapped to Design Tokens */
      fontSize: {
        xs: "var(--font-size-xs)",
        sm: "var(--font-size-sm)",
        base: "var(--font-size-base)",
        lg: "var(--font-size-lg)",
        xl: "var(--font-size-xl)",
        "2xl": "var(--font-size-2xl)",
        "3xl": "var(--font-size-3xl)",
        "4xl": "var(--font-size-4xl)",
        "5xl": "var(--font-size-5xl)",
      },

      /* Font Weights - Mapped to Design Tokens */
      fontWeight: {
        light: "var(--font-weight-light)",
        normal: "var(--font-weight-normal)",
        medium: "var(--font-weight-medium)",
        semibold: "var(--font-weight-semibold)",
        bold: "var(--font-weight-bold)",
      },

      /* Line Heights - Mapped to Design Tokens */
      lineHeight: {
        tight: "var(--line-height-tight)",
        snug: "var(--line-height-snug)",
        normal: "var(--line-height-normal)",
        relaxed: "var(--line-height-relaxed)",
        loose: "var(--line-height-loose)",
      },

      /* Letter Spacing - Mapped to Design Tokens */
      letterSpacing: {
        tight: "var(--letter-spacing-tight)",
        normal: "var(--letter-spacing-normal)",
        wide: "var(--letter-spacing-wide)",
        wider: "var(--letter-spacing-wider)",
        uppercase: "var(--letter-spacing-uppercase)",
      },

      /* Colors - Mapped to Design Tokens */
      colors: {
        /* Primary Brand */
        primary: {
          DEFAULT: "var(--color-primary)",
          dark: "var(--color-primary-dark)",
          light: "var(--color-primary-light)",
          lighter: "var(--color-primary-lighter)",
        },

        /* Accent Brand */
        accent: {
          DEFAULT: "var(--color-accent)",
          dark: "var(--color-accent-dark)",
          light: "var(--color-accent-light)",
        },

        /* Neutral Gray Scale */
        neutral: {
          50: "var(--color-neutral-50)",
          100: "var(--color-neutral-100)",
          200: "var(--color-neutral-200)",
          300: "var(--color-neutral-300)",
          400: "var(--color-neutral-400)",
          500: "var(--color-neutral-500)",
          600: "var(--color-neutral-600)",
          700: "var(--color-neutral-700)",
          800: "var(--color-neutral-800)",
          900: "var(--color-neutral-900)",
        },

        /* Cream (Legacy) */
        cream: {
          DEFAULT: "var(--color-neutral-50)",
          dark: "var(--color-neutral-100)",
        },

        /* Semantic Colors */
        success: "var(--color-success)",
        error: "var(--color-error)",
        warning: "var(--color-warning)",
        info: "var(--color-info)",

        /* Context Colors */
        background: {
          primary: "var(--color-bg-primary)",
          secondary: "var(--color-bg-secondary)",
        },

        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
        },

        border: "var(--color-border)",
      },

      /* Spacing - Mapped to Design Tokens */
      spacing: {
        0: "var(--space-0)",
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        8: "var(--space-8)",
        10: "var(--space-10)",
        12: "var(--space-12)",
        14: "var(--space-14)",
        16: "var(--space-16)",
        20: "var(--space-20)",
        24: "var(--space-24)",
      },

      /* Border Radius - Mapped to Design Tokens */
      borderRadius: {
        none: "var(--radius-none)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        full: "var(--radius-full)",
      },

      /* Box Shadows - Mapped to Design Tokens */
      boxShadow: {
        none: "var(--shadow-none)",
        sm: "var(--shadow-sm)",
        base: "var(--shadow-base)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        card: "var(--shadow-base)",
        "card-md": "var(--shadow-md)",
      },

      /* Transition Duration - Mapped to Design Tokens */
      transitionDuration: {
        fast: "150ms",
        base: "250ms",
        slow: "350ms",
      },

      /* Transition Timing - Using ease-in-out */
      transitionTimingFunction: {
        smooth: "ease-in-out",
      },

      /* Z-Index Scale */
      zIndex: {
        dropdown: "var(--z-dropdown)",
        sticky: "var(--z-sticky)",
        fixed: "var(--z-fixed)",
        "modal-backdrop": "var(--z-modal-backdrop)",
        modal: "var(--z-modal)",
        popover: "var(--z-popover)",
        tooltip: "var(--z-tooltip)",
      },

      /* Background Images */
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },

      /* Animation - Mapped to Design Tokens */
      animation: {
        spin: "spin var(--animation-spin)",
        pulse: "pulse var(--animation-pulse)",
        bounce: "bounce var(--animation-bounce)",
        "fade-in": "fadeIn var(--transition-slow)",
        "slide-up": "slideUp var(--transition-slow)",
        "slide-down": "slideDown var(--transition-slow)",
      },

      /* Min/Max Heights for Components */
      minHeight: {
        button: "var(--button-height-md)",
        input: "var(--input-height)",
      },

      maxWidth: {
        xs: "20rem",
        sm: "24rem",
        md: "28rem",
        lg: "32rem",
        xl: "36rem",
        "2xl": "42rem",
        "3xl": "48rem",
        "4xl": "56rem",
        "5xl": "64rem",
        "6xl": "72rem",
        full: "100%",
      },
    },
  },
  plugins: [],
};
export default config;
