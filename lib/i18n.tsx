"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BRAND_NAME,
  DEFAULT_LOCALE,
  LOCALE_CATALOG_IDS,
  STORAGE_KEYS,
} from "./constants";
import { storage } from "./storage";
import amET from "../public/locales/am-ET.json";
import enGB from "../public/locales/en-GB.json";
import enUS from "../public/locales/en-US.json";
import omET from "../public/locales/om-ET.json";
import soET from "../public/locales/so-ET.json";
import tiET from "../public/locales/ti-ET.json";

type Messages = Record<string, string>;

const catalogs: Record<string, Messages> = {
  "am-ET": amET as Messages,
  "en-GB": enGB as Messages,
  "en-US": enUS as Messages,
  "om-ET": omET as Messages,
  "so-ET": soET as Messages,
  "ti-ET": tiET as Messages,
};

const EN_FALLBACK = catalogs["en-US"];

type I18nContextValue = {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string) => string;
  ready: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function translate(messages: Messages, key: string, fallback: Messages) {
  if (key === "title") {
    return messages.title || fallback.title || BRAND_NAME;
  }
  const value = messages[key];
  if (value != null && value !== "") {
    return value;
  }
  const fb = fallback[key];
  if (fb != null && fb !== "") {
    return fb;
  }
  return key.replaceAll("_", " ");
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = storage.get(STORAGE_KEYS.locale);
    const known = LOCALE_CATALOG_IDS as readonly string[];
    const next = saved && known.includes(saved) ? saved : DEFAULT_LOCALE;
    setLocaleState(next);
    setReady(true);
  }, []);

  const setLocale = useCallback((next: string) => {
    if (!(LOCALE_CATALOG_IDS as readonly string[]).includes(next)) {
      return;
    }
    storage.set(STORAGE_KEYS.locale, next);
    setLocaleState(next);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
  }, [locale, ready]);

  const messages = catalogs[locale] ?? catalogs[DEFAULT_LOCALE] ?? EN_FALLBACK;

  const t = useCallback(
    (key: string) => translate(messages, key, EN_FALLBACK),
    [messages],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, ready }),
    [locale, setLocale, t, ready],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
