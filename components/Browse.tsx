import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type * as splToken from '@solana/spl-token'
import type { TokenData } from 'apis/api'
import { GlyphActivity } from 'assets/GlyphActivity'
import { GlyphBrowse } from 'assets/GlyphBrowse'
import { HeaderSlim } from 'common/HeaderSlim'
import { HeroLarge } from 'common/HeroLarge'
import { Info } from 'common/Info'
import { MultiSelector } from 'common/MultiSelector'
import {
  filterTokensByAttributes,
  getAllAttributes,
  getNFTAtrributeFilters,
} from 'common/NFTAttributeFilters'
import { RefreshButton } from 'common/RefreshButton'
import { Selector } from 'common/Selector'
import { TabSelector } from 'common/TabSelector'
import { getPriceOrRentalRate, getRentalDuration } from 'common/tokenDataUtils'
import { Activity } from 'components/Activity'
import type { ProjectConfig, TokenSection } from 'config/config'
import type { BrowseAvailableTokenData } from 'hooks/useBrowseAvailableTokenDatas'
import { useBrowseAvailableTokenDatas } from 'hooks/useBrowseAvailableTokenDatas'
import type { BrowseClaimedTokenData } from 'hooks/useBrowseClaimedTokenDatas'
import { useBrowseClaimedTokenDatas } from 'hooks/useBrowseClaimedTokenDatas'
import { usePaymentMints } from 'hooks/usePaymentMints'
import { useWalletId } from 'hooks/useWalletId'
import type { Environment } from 'providers/EnvironmentProvider'
import { filterTokens, useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUTCNow } from 'providers/UTCNowProvider'
import { useState } from 'react'

import { TokenQueryData } from './TokenQueryData'

enum OrderCategories {
  RecentlyListed = 'Recently Listed',
  RateLowToHigh = 'Rate: Low to High',
  RateHighToLow = 'Rate: High to Low',
  DurationLowToHigh = 'Max Duration: Low to High',
  DurationHighToLow = 'Max Duration: High to Low',
}

export type PANE_OPTIONS = 'browse' | 'activity'
export const PANE_TABS: {
  label: JSX.Element
  value: PANE_OPTIONS
  disabled?: boolean
  tooltip?: string
}[] = [
  {
    label: <GlyphBrowse />,
    value: 'browse',
  },
  {
    label: (
      <div className="flex items-center gap-2">
        <GlyphActivity />
        Activity
      </div>
    ),
    value: 'activity',
    disabled: true,
    tooltip: 'Coming soon',
  },
]

export const tokenSectionsForConfig = (config: ProjectConfig) => {
  return (
    config.sections ?? [
      {
        id: 'available',
        header: 'Available',
        icon: 'info',
        description:
          'All listed tokens currently available to rent are displayed below',
        filter: {
          type: 'state',
          value: [TokenManagerState.Issued.toString()],
        },
        showEmpty: true,
      },
      {
        id: 'rented',
        header: 'Rented',
        icon: 'info',
        description: 'All currently claimed rentals are displayed below',
        showEmpty: true,
        filter: {
          type: 'state',
          value: [TokenManagerState.Claimed.toString()],
        },
      },
    ]
  )
}

export function sortTokens<
  T extends Pick<
    TokenData,
    'tokenManager' | 'claimApprover' | 'timeInvalidator'
  >
>(
  tokens: T[],
  selectedOrderCategory: OrderCategories,
  config: ProjectConfig,
  UTCNow: number,
  claimed: boolean,
  paymentMints: { [name: string]: splToken.MintInfo }
): T[] {
  let sortedTokens
  switch (selectedOrderCategory) {
    case OrderCategories.RecentlyListed:
      sortedTokens = tokens.sort((a, b) => {
        return (
          (a.tokenManager?.parsed.stateChangedAt.toNumber() ?? 0) -
          (b.tokenManager?.parsed.stateChangedAt.toNumber() ?? 0)
        )
      })
      break
    case OrderCategories.RateLowToHigh:
      sortedTokens = tokens.sort((a, b) => {
        return (
          getPriceOrRentalRate(config, a, paymentMints) -
          getPriceOrRentalRate(config, b, paymentMints)
        )
      })
      break
    case OrderCategories.RateHighToLow:
      sortedTokens = tokens.sort((a, b) => {
        return (
          getPriceOrRentalRate(config, b, paymentMints) -
          getPriceOrRentalRate(config, a, paymentMints)
        )
      })
      break
    case OrderCategories.DurationLowToHigh:
      sortedTokens = tokens.sort((a, b) => {
        return (
          getRentalDuration(a, UTCNow, claimed) -
          getRentalDuration(b, UTCNow, claimed)
        )
      })
      break
    case OrderCategories.DurationHighToLow:
      sortedTokens = tokens.sort((a, b) => {
        return (
          getRentalDuration(b, UTCNow, claimed) -
          getRentalDuration(a, UTCNow, claimed)
        )
      })
      break
    default:
      return []
  }
  return sortedTokens
}

export const groupTokens = (
  tokens: TokenData[],
  sections: TokenSection[],
  environment: Environment
): TokenSection[] => {
  return tokens.reduce((acc, tk) => {
    let isPlaced = false
    return acc.map((section) => {
      const filteredToken = !isPlaced
        ? filterTokens([tk], section.filter, environment.label)
        : []
      if (filteredToken.length > 0 && !isPlaced) {
        isPlaced = true
        return {
          ...section,
          tokens: [...(section.tokens ?? []), tk],
        }
      }
      return section
    })
  }, sections)
}

export const Browse = () => {
  const walletId = useWalletId()
  const { config } = useProjectConfig()
  const { UTCNow } = useUTCNow()
  const paymentMintInfos = usePaymentMints()
  const [selectedOrderCategory, setSelectedOrderCategory] =
    useState<OrderCategories>(OrderCategories.RateLowToHigh)
  const [selectedFilters, setSelectedFilters] = useState<{
    [filterName: string]: string[]
  }>({})
  const tokenSections = tokenSectionsForConfig(config)
  const [selectedGroup, setSelectedGroup] = useState(0)
  const [pane, setPane] = useState<PANE_OPTIONS>('browse')
  const availableTokenDatas = useBrowseAvailableTokenDatas(
    false,
    selectedGroup !== 0
  )
  const claimedTokenDatas = useBrowseClaimedTokenDatas(selectedGroup !== 1)

  const tokenQuery =
    selectedGroup === 0 ? availableTokenDatas : claimedTokenDatas

  const sortedAttributes = getAllAttributes(tokenQuery.data ?? [])
  const filteredAndSortedTokens = sortTokens(
    filterTokensByAttributes<BrowseAvailableTokenData | BrowseClaimedTokenData>(
      tokenQuery.data ?? [],
      selectedFilters
    ),
    selectedOrderCategory,
    config,
    UTCNow,
    selectedGroup === 1,
    paymentMintInfos.data ?? {}
  )
  return (
    <>
      <HeaderSlim
        tabs={[
          { name: 'Browse', anchor: 'browse' },
          {
            name: 'Manage',
            anchor: 'manage',
            disabled: !walletId,
            tooltip: !walletId ? 'Connect wallet' : undefined,
          },
        ]}
      />
      <HeroLarge />
      <div className="mx-10 mt-4 flex items-end gap-2">
        <div className="text-xl text-light-0">Results</div>
        <div className="relative -top-[0.6px] text-base text-medium-4">
          {filteredAndSortedTokens?.length ?? 0}{' '}
        </div>
      </div>
      <div className="mx-10 mt-4 flex flex-wrap justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <TabSelector
            colorized
            defaultOption={{
              value: 0,
              label: tokenSections[0]?.header,
            }}
            options={tokenSections.map((g, i) => ({
              label: g.header,
              value: i,
            }))}
            onChange={(o) => {
              setSelectedGroup(o.value)
            }}
          />
          <MultiSelector<string>
            colorized
            placeholder="Select filters"
            defaultValue={
              Object.values(selectedFilters).reduce(
                (acc, v) => acc + v.length,
                0
              ) > 0 ? (
                <div className="text-light-0">
                  {Object.values(selectedFilters).reduce(
                    (acc, v) => acc + v.length,
                    0
                  )}{' '}
                  filter applied
                </div>
              ) : undefined
            }
            onChange={(v) => !v && setSelectedFilters({})}
            groups={getNFTAtrributeFilters({
              tokenDatas: tokenQuery.data,
              config,
              sortedAttributes,
              selectedFilters,
              setSelectedFilters,
            })}
          />
          <Selector<OrderCategories>
            colorized
            className="min-w-[240px]"
            defaultOption={{
              label: OrderCategories.RateLowToHigh,
              value: OrderCategories.RateLowToHigh,
            }}
            onChange={(e) => {
              setSelectedOrderCategory(
                e?.value ?? OrderCategories.RateLowToHigh
              )
            }}
            options={(
              Object.values(OrderCategories) as Array<OrderCategories>
            ).map((v) => ({ label: v, value: v }))}
          />
        </div>
        <div className="flex gap-4">
          <RefreshButton
            colorized
            isFetching={tokenQuery.isFetching}
            dataUpdatdAtMs={tokenQuery.dataUpdatedAt}
            handleClick={() => tokenQuery.refetch()}
          />
          <TabSelector<PANE_OPTIONS>
            defaultOption={PANE_TABS[0]}
            options={PANE_TABS}
            onChange={(o) => {
              setPane(o.value)
            }}
          />
        </div>
      </div>
      <Info colorized {...tokenSections[selectedGroup]} />
      {
        {
          activity: <Activity />,
          browse: (
            <TokenQueryData
              isFetched={tokenQuery.isFetched}
              isFetching={tokenQuery.isFetching}
              tokenDatas={filteredAndSortedTokens}
            />
          ),
        }[pane]
      }
    </>
  )
}
