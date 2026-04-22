import basic from './questions.json'
import smartCoachBerlin from './SmartCoachBerlin.json'

export interface Question {
  id: number
  text: string
  min: number
  max: number
}

export interface Catalog {
  key: string
  name: string
  questions: Question[]
}

export const catalogs: Catalog[] = [
  { key: 'basic', name: 'Standard', questions: basic as Question[] },
  { key: 'SmartCoachBerlin', name: 'SmartCoach Berlin', questions: smartCoachBerlin as Question[] },
]

export function getCatalogQuestions(key: string): Question[] {
  return catalogs.find(c => c.key === key)?.questions ?? basic as Question[]
}
