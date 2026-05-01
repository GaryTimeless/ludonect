import { createI18n } from 'vue-i18n'
import de from '@/locales/de'
import en from '@/locales/en'

const savedLocale = localStorage.getItem('locale') ?? 'de'

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'de',
  messages: { de, en },
})

export default i18n

