import type { ReactChild } from 'react'
import React, { useContext, useState } from 'react'

export interface MetadataDataValues {
  metadata: string[]
  setMetadata: (newEnvironment: string[]) => void
  values: string[]
  setValues: (newEnvironment: string[]) => void
}

const MetadataData: React.Context<MetadataDataValues> =
  React.createContext<MetadataDataValues>({
    metadata: [],
    setMetadata: () => {},
    values: [],
    setValues: () => {},
  })

export function MetadataProvider({ children }: { children: ReactChild }) {
  const [metadata, setMetadata] = useState<string[]>([])
  const [values, setValues] = useState<string[]>([])

  return (
    <MetadataData.Provider
      value={{
        metadata: metadata,
        setMetadata,
        values: values,
        setValues,
      }}
    >
      {children}
    </MetadataData.Provider>
  )
}

export function useMetadataData(): MetadataDataValues {
  return useContext(MetadataData)
}
