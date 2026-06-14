"use client"

import { createContext, useContext, useState } from "react"

interface TranslationContextValue {
  isJapanese: boolean
  setIsJapanese: (v: boolean) => void
}

const TranslationContext = createContext<TranslationContextValue>({
  isJapanese: false,
  setIsJapanese: () => {},
})

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [isJapanese, setIsJapanese] = useState(false)
  return (
    <TranslationContext.Provider value={{ isJapanese, setIsJapanese }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  return useContext(TranslationContext)
}
