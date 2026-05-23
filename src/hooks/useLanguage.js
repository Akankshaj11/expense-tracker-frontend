import { useEffect, useMemo, useState } from 'react'
import translations from '../i18n/translations'

function getStoredLanguage() {
  try {
    return localStorage.getItem('selectedLanguage') || 'en'
  } catch {
    return 'en'
  }
}

function applyLanguage(language) {
  try {
    localStorage.setItem('selectedLanguage', language)
    document.documentElement.lang = language
    window.dispatchEvent(new CustomEvent('language:changed', { detail: { language } }))
  } catch {
    // ignore
  }
}

export function useLanguage() {
  const [language, setLanguageState] = useState(getStoredLanguage)

  useEffect(() => {
    const handleLanguageChanged = (event) => {
      const nextLanguage = event?.detail?.language || event?.newValue || getStoredLanguage()
      setLanguageState(nextLanguage || 'en')
    }

    const handleStorageChange = (event) => {
      if (event.key === 'selectedLanguage') {
        handleLanguageChanged(event)
      }
    }

    window.addEventListener('language:changed', handleLanguageChanged)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('language:changed', handleLanguageChanged)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  useEffect(() => {
    try {
      document.documentElement.lang = language
    } catch {
      // ignore
    }
  }, [language])

  const setLanguage = (nextLanguage) => {
    const normalizedLanguage = nextLanguage || 'en'
    setLanguageState(normalizedLanguage)
    applyLanguage(normalizedLanguage)
  }

  const text = useMemo(() => ({
    ...translations.en,
    ...(translations[language] || {}),
  }), [language])

  return { language, setLanguage, text }
}

export default useLanguage
