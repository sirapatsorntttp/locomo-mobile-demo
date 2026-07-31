"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import type { Lang, Translations } from "./i18n";
import { translations } from "./i18n";

type Group = keyof Translations;
type Key<G extends Group> = keyof Translations[G] & string;

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: <G extends Group>(group: G, key: Key<G>) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: "th",
  setLang: () => {},
  toggleLang: () => {},
  t: (_g, k) => k as string,
});

const STORAGE_KEY = "locomo-lang";

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("th");

  // โหลดค่าที่เคยเลือกจาก localStorage (client only)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;

    if (saved === "th" || saved === "en") {
      setLangState(saved);
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);

    localStorage.setItem(STORAGE_KEY, l); // จำค่า
  };

  const toggleLang = () => setLang(lang === "th" ? "en" : "th");

  function t<G extends Group>(group: G, key: Key<G>): string {
    const entry = (
      translations[group] as Record<string, { th: string; en: string }>
    )[key as string];
    return entry?.[lang] ?? (key as string);
  }

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
