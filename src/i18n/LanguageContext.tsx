import { createContext, useContext, useState, type ReactNode } from 'react'
import { translations, type LanguageCode, type Translations } from './translations'

const LANGUAGE_STORAGE_KEY = 'npos-language'

const isLanguageCode = (value: string | null): value is LanguageCode =>
  value === 'pt' || value === 'en' || value === 'es'

const getStoredLanguage = (): LanguageCode => {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return isLanguageCode(saved) ? saved : 'pt'
  } catch {
    return 'pt'
  }
}

interface LanguageContextValue {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'pt',
  setLanguage: () => {},
  t: translations.pt,
})

export const useLanguage = () => useContext(LanguageContext)

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<LanguageCode>(getStoredLanguage)

  const setLanguage = (lang: LanguageCode) => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
    } catch {
      // no-op when localStorage is unavailable
    }
    setLanguageState(lang)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  )
}
