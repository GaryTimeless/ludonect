import { useI18n } from 'vue-i18n'

/**
 * Returns the localised text for a question object.
 * questions.json supports both:
 *   - legacy: { text: "string" }
 *   - multilingual: { text: { de: "...", en: "..." } }
 */
export function useLocaleQuestion() {
  const { locale } = useI18n()

  function getQuestionText(question: any): string {
    if (!question) return ''
    if (typeof question.text === 'string') return question.text
    return (question.text as Record<string, string>)[locale.value]
      ?? (question.text as Record<string, string>).de
      ?? ''
  }

  return { getQuestionText }
}

