// Design System for Sequence Game
// Centralized colors, typography, and component styles

export const colors = {
  // Primary colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main primary
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Secondary colors
  secondary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Main secondary
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  
  // Accent colors
  accent: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#8b5cf6', // Main accent
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  
  // Neutral colors
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Player colors (for game pieces)
  players: {
    player1: '#ef4444', // Red
    player2: '#3b82f6', // Blue
    player3: '#10b981', // Green
    player4: '#f59e0b', // Yellow/Orange
  },
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Game state colors
  game: {
    selected: '#fbbf24', // Yellow
    possible: '#60a5fa', // Light blue
    sequence: '#10b981', // Green
    disabled: '#9ca3af', // Gray
  }
} as const;

export const typography = {
  // Font families
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  
  // Font sizes
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  
  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Line heights
  lineHeight: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  }
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
  '4xl': '6rem',
} as const;

export const borderRadius = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
} as const;

// Component style classes
export const componentStyles = {
  // Buttons
  button: {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:transform hover:-translate-y-0.5 hover:shadow-lg disabled:bg-neutral-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:transform hover:-translate-y-0.5 hover:shadow-lg disabled:bg-neutral-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
    accent: 'bg-accent-500 hover:bg-accent-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:transform hover:-translate-y-0.5 hover:shadow-lg disabled:bg-neutral-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
    outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200',
    ghost: 'text-primary-500 hover:bg-primary-50 font-semibold py-3 px-6 rounded-lg transition-all duration-200',
  },
  
  // Cards
  card: {
    base: 'bg-white rounded-xl shadow-md border border-neutral-200 p-6',
    elevated: 'bg-white rounded-xl shadow-lg border border-neutral-200 p-6',
    interactive: 'bg-white rounded-xl shadow-md border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-200 cursor-pointer',
  },
  
  // Inputs
  input: {
    base: 'w-full px-4 py-3 border-2 border-neutral-300 rounded-lg bg-white text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200',
    error: 'w-full px-4 py-3 border-2 border-error rounded-lg bg-white text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-error focus:ring-2 focus:ring-red-200 transition-all duration-200',
  },
  
  // Badges
  badge: {
    primary: 'bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium',
    secondary: 'bg-secondary-100 text-secondary-800 px-3 py-1 rounded-full text-sm font-medium',
    accent: 'bg-accent-100 text-accent-800 px-3 py-1 rounded-full text-sm font-medium',
    success: 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium',
    warning: 'bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium',
    error: 'bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium',
  },
  
  // Game specific
  gameBoard: {
    container: 'bg-gradient-to-br from-neutral-50 to-primary-50 p-6 rounded-xl shadow-lg border border-neutral-200',
    grid: 'grid grid-cols-10 gap-1 max-w-2xl mx-auto',
    position: 'w-12 h-12 border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-200 rounded-md',
    chip: 'w-8 h-8 rounded-full border-2 border-white shadow-sm',
    legend: 'mt-6 flex justify-center space-x-6 text-sm',
    legendItem: 'flex items-center space-x-2',
  },
  
  cardHand: {
    container: 'bg-gradient-to-br from-neutral-50 to-secondary-50 p-6 rounded-xl shadow-md border border-neutral-200',
    header: 'flex items-center justify-between mb-4',
    playerName: 'text-lg font-semibold text-neutral-800',
    cardCount: 'text-sm text-neutral-600',
    cards: 'flex flex-wrap gap-3 justify-center',
    card: 'w-16 h-20 border-2 rounded-lg flex flex-col items-center justify-center text-sm font-bold transition-all duration-200 shadow-sm',
    selectedCard: 'mt-4 text-center p-3 bg-primary-50 rounded-lg border border-primary-200',
  },
  
  gameControls: {
    container: 'bg-white p-6 rounded-xl shadow-md border border-neutral-200',
    header: 'text-center mb-6',
    title: 'text-2xl font-bold text-neutral-800',
    subtitle: 'text-neutral-600 text-lg',
    controls: 'flex flex-wrap gap-3 justify-center',
    info: 'mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200',
    instructions: 'mt-4 text-sm text-neutral-500',
  }
} as const;

// CSS custom properties for dynamic theming
export const cssVariables = {
  '--color-primary': colors.primary[500],
  '--color-primary-dark': colors.primary[600],
  '--color-secondary': colors.secondary[500],
  '--color-secondary-dark': colors.secondary[600],
  '--color-accent': colors.accent[500],
  '--color-accent-dark': colors.accent[600],
  '--color-text-primary': colors.neutral[800],
  '--color-text-secondary': colors.neutral[600],
  '--color-text-muted': colors.neutral[400],
  '--color-border': colors.neutral[200],
  '--color-background': colors.neutral[50],
  '--color-card': '#ffffff',
  '--shadow-sm': shadows.sm,
  '--shadow-md': shadows.md,
  '--shadow-lg': shadows.lg,
} as const;

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  componentStyles,
  cssVariables,
};
