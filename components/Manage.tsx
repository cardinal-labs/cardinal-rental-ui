import type { PublicKey } from '@solana/web3.js'
import type { TokenData } from 'apis/api'
import { HeaderSlim } from 'common/HeaderSlim'
import { HeroSmall } from 'common/HeroSmall'
import { getAllAttributes } from 'common/NFTAttributeFilters'
import { SelecterDrawer } from 'common/SelectedDrawer'
import { elligibleForRent } from 'common/tokenDataUtils'
import type { TokenFilter } from 'config/config'
import { useManagedTokens } from 'hooks/useManagedTokens'
import { useUserTokenData } from 'hooks/useUserTokenData'
import { useWalletId } from 'hooks/useWalletId'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useState } from 'react'
import { useQuery } from 'react-query'

import { TokenQueryResults } from './TokenQueryResults'

export type ManageTokenGroupId = 'all' | 'available' | 'rented' | 'rented-out'

export type ManageTokenGroup = {
  id: ManageTokenGroupId
  header?: string
  description?: string
  icon?:
    | 'time'
    | 'featured'
    | 'listed'
    | 'rented'
    | 'available'
    | 'info'
    | 'performance'
  filter?: TokenFilter
}

export const manageTokenGroups = (
  walletId: PublicKey | undefined
): ManageTokenGroup[] => [
  {
    id: 'all',
    header: 'All',
    description:
      'View all tokens affiliated with your wallet on this marketplace',
    icon: 'performance',
    filter: {
      type: 'claimer',
      value: [walletId?.toString() || ''],
    },
  },
  {
    id: 'available',
    header: 'Available',
    description:
      'View and select all tokens available for rent on this marketplace',
    icon: 'available',
    filter: {
      type: 'owner',
      value: [walletId?.toString() || ''],
    },
  },
  {
    id: 'rented',
    header: 'Rented',
    description:
      'View all tokens you have currently rented on this marketplace',
    icon: 'performance',
    filter: {
      type: 'claimer',
      value: [walletId?.toString() || ''],
    },
  },
  {
    id: 'rented-out',
    header: 'Rented out',
    description:
      'View all your currently rented out tokens on this marketplace',
    icon: 'performance',
    filter: {
      type: 'issuer',
      value: [walletId?.toString() || ''],
    },
  },
]

export const tokenDatasId = (tokenDatas: TokenData[] | undefined) =>
  tokenDatas
    ?.map((tokenData) => tokenData.metaplexData?.pubkey.toString())
    .join(',')

export const Manage = () => {
  const walletId = useWalletId()
  const { config } = useProjectConfig()

  const userTokenDatas = useUserTokenData(config.filter)
  const managedTokens = useManagedTokens()
  const allManagedTokens = useQuery(
    [
      'useAllManagedTokens',
      walletId?.toString(),
      tokenDatasId(userTokenDatas.data),
      tokenDatasId(managedTokens.data),
    ],
    () => {
      return [
        ...(userTokenDatas.data ?? []),
        ...(managedTokens.data?.filter(
          (tokenData) =>
            !userTokenDatas.data
              ?.map((userTokenData) =>
                userTokenData.metaplexData?.pubkey.toString()
              )
              .includes(tokenData.metaplexData?.pubkey.toString())
        ) ?? []),
      ]
    },
    {
      enabled: !!userTokenDatas.isFetched && !!managedTokens.isFetched,
    }
  )
  const availableTokens = useQuery(
    [
      'availableTokens',
      walletId?.toString(),
      tokenDatasId(userTokenDatas.data),
    ],
    () => {
      return (userTokenDatas.data ?? []).filter((tokenData) =>
        elligibleForRent(config, tokenData)
      )
    },
    {
      enabled: !!userTokenDatas.data,
    }
  )

  const rentedTokens = useQuery(
    [
      'useRentedTokens',
      walletId?.toString(),
      tokenDatasId(userTokenDatas.data),
    ],
    () => {
      return (userTokenDatas.data ?? []).filter((tokenData) => {
        return !!tokenData.tokenManager
      })
    },
    {
      enabled: !!userTokenDatas.data,
    }
  )

  const [selectedGroup, setSelectedGroup] = useState<ManageTokenGroupId>('all')
  const [selectedTokens, setSelectedTokens] = useState<TokenData[]>([])
  const attributeFilterOptions = getAllAttributes(allManagedTokens.data ?? [])
  return (
    <>
      <SelecterDrawer
        selectedTokens={selectedTokens}
        onClose={() => setSelectedTokens([])}
      />
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
      <HeroSmall />
      <TokenQueryResults
        tokenGroup={
          manageTokenGroups(walletId).find((g) => g.id === selectedGroup)!
        }
        setSelectedGroup={setSelectedGroup}
        tokenQuery={
          {
            all: {
              ...allManagedTokens,
              isFetching: userTokenDatas.isFetching || managedTokens.isFetching,
              dataUpdatedAt: Math.min(
                userTokenDatas.dataUpdatedAt,
                managedTokens.dataUpdatedAt
              ),
              refetch: () => {
                userTokenDatas.refetch()
                return managedTokens.refetch()
              },
            },
            available: {
              ...availableTokens,
              isFetching: userTokenDatas.isFetching,
              dataUpdatedAt: userTokenDatas.dataUpdatedAt,
              refetch: userTokenDatas.refetch,
            },
            rented: {
              ...rentedTokens,
              isFetching: userTokenDatas.isFetching,
              dataUpdatedAt: userTokenDatas.dataUpdatedAt,
              refetch: userTokenDatas.refetch,
            },
            'rented-out': managedTokens,
          }[selectedGroup]
        }
        attributeFilterOptions={attributeFilterOptions}
      />
    </>
  )
}
