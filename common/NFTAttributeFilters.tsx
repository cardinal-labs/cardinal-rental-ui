import { css } from '@emotion/react'
import type { TokenData } from 'apis/api'
import type { ProjectConfig } from 'config/config'

export const attributesForTokenData = (
  tokenData: Pick<TokenData, 'indexedData'> | Pick<TokenData, 'metadata'>
): { trait_type: string; value: string }[] => {
  return 'metadata' in tokenData
    ? tokenData.metadata?.parsed?.attributes
    : 'indexedData' in tokenData
    ? tokenData.indexedData?.mint_address_nfts?.metadatas_attributes
    : []
}

export const getAllAttributes = (
  tokens: (Pick<TokenData, 'indexedData'> | Pick<TokenData, 'metadata'>)[]
): NFTAtrributeFilterValues => {
  const allAttributes: { [traitType: string]: Set<string> } = {}
  tokens.forEach((tokenData) => {
    const attributes = attributesForTokenData(tokenData)
    if (attributes && attributes.length > 0) {
      attributes.forEach((attribute: { trait_type: string; value: string }) => {
        if (attribute.trait_type in allAttributes) {
          allAttributes[attribute.trait_type]!.add(attribute.value)
        } else {
          allAttributes[attribute.trait_type] = new Set([attribute.value])
        }
      })
    }
  })

  const sortedAttributes: { [traitType: string]: string[] } = {}
  Object.keys(allAttributes).forEach((traitType) => {
    sortedAttributes[traitType] = Array.from(allAttributes[traitType] ?? [])
  })
  return sortedAttributes
}

export function filterTokensByAttributes<
  T extends Pick<TokenData, 'indexedData'> | Pick<TokenData, 'metadata'>
>(tokens: T[], filters: NFTAtrributeFilterValues, union = false): T[] {
  if (
    Object.keys(filters).length <= 0 ||
    Object.values(filters).filter((v) => v.length > 0).length <= 0
  ) {
    return tokens
  }
  return tokens.filter((tokenData) => {
    let matchOne = false
    let missOne = false
    Object.keys(filters).forEach((filterName) => {
      filters[filterName]?.forEach((val) => {
        if (
          attributesForTokenData(tokenData).filter(
            (a: { trait_type: string; value: string }) =>
              a.trait_type === filterName && a.value === val
          ).length > 0
        ) {
          matchOne = true
        } else {
          missOne = true
        }
      })
    })
    return union ? matchOne : !missOne
  })
}

export type NFTAtrributeFilterValues = { [filterName: string]: string[] }

interface NFTAtrributeFiltersProps {
  tokenDatas?: (Pick<TokenData, 'indexedData'> | Pick<TokenData, 'metadata'>)[]
  config: ProjectConfig
  sortedAttributes: NFTAtrributeFilterValues
  selectedFilters: NFTAtrributeFilterValues
  setSelectedFilters: (arg: NFTAtrributeFilterValues) => void
}

export const getNFTAtrributeFilters = ({
  tokenDatas,
  config,
  sortedAttributes,
  selectedFilters,
  setSelectedFilters,
}: NFTAtrributeFiltersProps) => {
  return Object.keys(sortedAttributes)
    .sort()
    .map((traitType) => ({
      label: traitType,
      count: selectedFilters[traitType]?.length,
      content: (
        <div key={traitType} className="px-3 pb-3 text-xs">
          {sortedAttributes[traitType]!.map((value) => (
            <div
              key={`${traitType}-${value}`}
              className="flex items-center justify-between"
              onClick={() =>
                setSelectedFilters({
                  ...selectedFilters,
                  [traitType]: selectedFilters[traitType]?.includes(value)
                    ? selectedFilters[traitType]?.filter((v) => v !== value) ??
                      []
                    : [...(selectedFilters[traitType] ?? []), value],
                })
              }
            >
              <div
                className="group flex cursor-pointer items-center gap-2 py-[2px] text-light-0 transition-colors hover:text-primary"
                css={css`
                  &:hover {
                    color: ${config.colors.accent} !important;
                    div {
                      border-color: ${config.colors.accent} !important;
                    }
                  }
                `}
              >
                <div
                  className={`h-3 w-3 rounded-sm border-[.5px] border-light-1 transition-all group-hover:border-primary ${
                    selectedFilters[traitType]?.includes(value)
                      ? `bg-primary`
                      : ''
                  }`}
                  css={css`
                    background: ${selectedFilters[traitType]?.includes(value)
                      ? `${config.colors.accent} !important`
                      : ''};
                  `}
                >
                  {}
                </div>
                <div>{value}</div>
              </div>
              <div className="text-medium-3">
                {tokenDatas
                  ? filterTokensByAttributes(tokenDatas, {
                      [traitType]: [value],
                    }).length
                  : 0}
              </div>
            </div>
          ))}
        </div>
      ),
    }))
}
