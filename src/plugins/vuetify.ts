import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Vibrant & Playful Theme - Inspired by Duolingo/Kahoot
export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'ludonect',
    themes: {
      ludonect: {
        dark: false,
        colors: {
          // Primary - Vibrant Green (keeping brand color)
          primary: '#59981A',
          'primary-darken-1': '#4A7F15',
          'primary-lighten-1': '#6FAA2E',

          // Secondary - Playful Purple
          secondary: '#9C27B0',
          'secondary-darken-1': '#7B1FA2',
          'secondary-lighten-1': '#BA68C8',

          // Accent - Bold Orange
          accent: '#FF9800',
          'accent-darken-1': '#F57C00',
          'accent-lighten-1': '#FFB74D',

          // Supporting colors
          success: '#4CAF50',
          warning: '#FFC107',
          error: '#F44336',
          info: '#2196F3',

          // Backgrounds
          background: '#EDFFCC',
          surface: '#FFFFFF',
          'surface-variant': '#F5F5F5',

          // Text
          'on-primary': '#EDFFCC',
          'on-secondary': '#FFFFFF',
          'on-background': '#385028',
          'on-surface': '#385028',
        },
      },
    },
  },
  defaults: {
    // Global component defaults for consistent styling
    VBtn: {
      style: 'text-transform: none;',
      elevation: 0,
      rounded: 'xl',
    },
    VCard: {
      elevation: 2,
      rounded: 'xl',
    },
    VTextField: {
      variant: 'outlined',
      rounded: 'lg',
    },
    VSlider: {
      color: 'primary',
      thumbLabel: true,
    },
  },
})
