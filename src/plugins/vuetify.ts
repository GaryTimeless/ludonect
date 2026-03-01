import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'ludonect',
    themes: {
      ludonect: {
        dark: false,
        colors: {
          primary: '#59981A',
          'primary-darken-1': '#4A7F15',
          'primary-lighten-1': '#6FAA2E',

          secondary: '#9C27B0',
          'secondary-darken-1': '#7B1FA2',
          'secondary-lighten-1': '#BA68C8',

          accent: '#FF9800',
          'accent-darken-1': '#F57C00',
          'accent-lighten-1': '#FFB74D',

          // Semantic colors — matching old Ionic palette
          success: '#2dd36f',
          warning: '#ffc409',
          error: '#eb445a',
          info: '#91a095',

          // Backgrounds
          background: '#EDFFCC',
          surface: '#FFFFFF',
          'surface-variant': '#F5F5F5',

          // Text on colored surfaces
          'on-primary': '#EDFFCC', // light text on green buttons
          'on-secondary': '#FFFFFF',
          'on-background': '#385028',
          'on-surface': '#385028',
          'on-success': '#FFFFFF',
          'on-error': '#FFFFFF',
          'on-info': '#FFFFFF',
          'on-warning': '#385028',
        },
      },
    },
  },
  defaults: {
    VBtn: {
      style: 'text-transform: none; font-family: "Tenor Sans", Arial, sans-serif;',
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
    VChip: {
      style: 'font-family: "Tenor Sans", Arial, sans-serif;',
    },
    VSnackbar: {
      color: 'surface',
    },
  },
})
