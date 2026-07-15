'use client'
import { createContext, useContext, useState, ReactNode } from 'react'
import type { Lang, Translations } from './i18n'
import { translations } from './i18n'

type Group = keyof Translations
type Key<G extends Group> = keyof Translations[G] & string

interface LangContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: <G extends Group>(group: G, key: Key<G>) => string
}

const LangContext = createContext<LangContextValue>({
  lang: 'th',
  setLang: () => {},
  t: (_g, k) => k as string,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('th')

  function t<G extends Group>(group: G, key: Key<G>): string {
    const entry = (translations[group] as Record<string, { th: string; en: string }>)[key as string]
    return entry?.[lang] ?? (key as string)
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
