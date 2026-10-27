import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources } from './resources'
import type { AppLocale } from './resources'

export { resources }
export type { AppLocale }

export const DEFAULT_LOCALE: AppLocale = 'id-ID'

/**
 * Instance terpisah per entrypoint supaya test bisa menginisialisasi locale
 * sendiri tanpa saling menimpa.
 */
export async function createI18n(locale: AppLocale = DEFAULT_LOCALE) {
  const instance = i18next.createInstance()
  await instance.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    defaultNS: 'translation',
    interpolation: { escapeValue: false },
  })
  return instance
}
