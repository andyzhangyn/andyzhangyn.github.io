"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export type SiteLanguage = "en" | "zh";

type LanguageContextValue = {
  language: SiteLanguage;
  setLanguage: Dispatch<SetStateAction<SiteLanguage>>;
};

const storageKey = "domino-visualization-language";
const languageChangeEvent = "domino-visualization-language-change";
const LanguageContext = createContext<LanguageContextValue | null>(null);

function isSiteLanguage(value: string | null): value is SiteLanguage {
  return value === "en" || value === "zh";
}

function readStoredLanguage(): SiteLanguage {
  const storedLanguage = window.localStorage.getItem(storageKey);
  return isSiteLanguage(storedLanguage) ? storedLanguage : "en";
}

function subscribeToLanguage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(languageChangeEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(languageChangeEvent, onStoreChange);
  };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore<SiteLanguage>(
    subscribeToLanguage,
    readStoredLanguage,
    () => "en",
  );

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  const setLanguage = useCallback<Dispatch<SetStateAction<SiteLanguage>>>(
    (nextLanguage) => {
      const resolvedLanguage = typeof nextLanguage === "function"
        ? nextLanguage(language)
        : nextLanguage;
      window.localStorage.setItem(storageKey, resolvedLanguage);
      window.dispatchEvent(new Event(languageChangeEvent));
    },
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useSiteLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useSiteLanguage must be used inside LanguageProvider.");
  }
  return context;
}
