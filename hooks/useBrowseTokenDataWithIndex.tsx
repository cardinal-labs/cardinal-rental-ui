import '@sentry/tracing'

import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import type { AccountData } from '@cardinal/common'
import type { PaidClaimApproverData } from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { TIME_INVALIDATOR_ADDRESS } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { findTimeInvalidatorAddress } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator/pda'
import type { TokenManagerData } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import {
  getTokenManagers,
  getTokenManagersByState,
  getTokenManagersForIssuer,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import type { UseInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import { USE_INVALIDATOR_ADDRESS } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import { findUseInvalidatorAddress } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator/pda'
import type * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import * as Sentry from '@sentry/browser'
import type * as spl from '@solana/spl-token'
import type { PublicKey } from '@solana/web3.js'
import { getTokenDatas } from 'apis/api'
import { tryPublicKey } from 'apis/utils'
import { elligibleForClaim } from 'common/tokenDataUtils'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import type { ParsedTokenAccountData } from 'providers/SolanaAccountsProvider'
import { useAccounts } from 'providers/SolanaAccountsProvider'
import { useQuery } from 'react-query'

import { TOKEN_DATA_KEY } from './useBrowseAvailableTokenDatas'

export type BrowseTokenData = {
  indexedData?: IndexedData
  tokenManager?: AccountData<TokenManagerData>
  metaplexData?: AccountData<metaplex.MetadataData>
  editionData?: AccountData<metaplex.EditionData | metaplex.MasterEditionData>
  claimApprover?: AccountData<PaidClaimApproverData> | null
  useInvalidator?: AccountData<UseInvalidatorData> | null
  timeInvalidator?: AccountData<TimeInvalidatorData> | null
  recipientTokenAccount?: AccountData<ParsedTokenAccountData>
}

export type IndexedData = {
  mint?: string
  address?: string
  invalidator_address?: { invalidator: string }[]
  mint_address_nfts?: {
    name?: string
    uri?: string
    edition_pda?: string
    metadatas_attributes?: {
      metadata_address: string
      trait_type: string
      value: string
    }[]
  }
}

export const useBrowseTokenDataWithIndex = () => {
  const { config } = useProjectConfig()
  const { connection, environment } = useEnvironmentCtx()
  const { getAccountDataById } = useAccounts()
  return useQuery<BrowseTokenData[]>(
    [TOKEN_DATA_KEY, 'useBrowseTokenDataWithIndex', config.name],
    async () => {
      if (
        (environment.index && config.filter?.type === 'creators') ||
        (config.filter?.type === 'issuer' && !config.indexDisabled)
      ) {
        const transaction = Sentry.startTransaction({
          name: `[useBrowseTokenDataWithIndex-v2] ${config.name}`,
        })

        ////
        const indexSpan = transaction.startChild({ op: 'index-lookup' })
        const indexer = new ApolloClient({
          uri: environment.index,
          cache: new InMemoryCache({ resultCaching: false }),
        })

        const tokenManagerResponse =
          config.filter.type === 'creators'
            ? await indexer.query({
                query: gql`
                  query GetTokenManagers($creators: [String!]!) {
                    cardinal_token_managers(
                      where: {
                        mint_address_nfts: {
                          metadatas_metadata_creators: {
                            _and: {
                              creator_address: { _in: $creators }
                              position: { _eq: 0 }
                              _and: { verified: { _eq: true } }
                            }
                          }
                        }
                      }
                    ) {
                      address
                      mint
                      state
                      state_changed_at
                      invalidator_address {
                        invalidator
                      }
                      mint_address_nfts {
                        uri
                        name
                        edition_pda
                        metadatas_attributes {
                          metadata_address
                          trait_type
                          value
                        }
                      }
                    }
                  }
                `,
                variables: {
                  creators: config.filter.value,
                },
              })
            : await indexer.query({
                query: gql`
                  query GetTokenManagers($issuers: [String!]!) {
                    cardinal_token_managers(
                      where: { issuer: { _in: $issuers } }
                    ) {
                      address
                      mint
                      state
                      state_changed_at
                      invalidator_address {
                        invalidator
                      }
                      mint_address_nfts {
                        uri
                        name
                        edition_pda
                        metadatas_attributes {
                          metadata_address
                          trait_type
                          value
                        }
                      }
                    }
                  }
                `,
                variables: {
                  issuers: config.filter.value,
                },
              })
        /////
        const indexedTokenManagers = tokenManagerResponse.data[
          'cardinal_token_managers'
        ] as IndexedData[]
        indexSpan.finish()

        /////
        const collectSpan = transaction.startChild({
          op: 'collect-known-invalidators',
        })
        const knownInvalidators: string[][] = await Promise.all(
          indexedTokenManagers.map(async ({ address }): Promise<string[]> => {
            const tokenManagerId = tryPublicKey(address)
            if (!tokenManagerId) return []
            const [[timeInvalidatorId], [useInvalidatorId]] = await Promise.all(
              [
                findTimeInvalidatorAddress(tokenManagerId),
                findUseInvalidatorAddress(tokenManagerId),
              ]
            )
            return [timeInvalidatorId.toString(), useInvalidatorId.toString()]
          })
        )
        collectSpan.finish()

        const filterSpan = transaction.startChild({
          op: 'filter-known-invalidators-v2',
        })
        const indexedTokenManagerDatas = Object.fromEntries(
          indexedTokenManagers
            .filter(
              (data, i) =>
                !data.invalidator_address?.some(
                  ({ invalidator }) =>
                    !config.showUnknownInvalidators &&
                    !knownInvalidators[i]?.includes(invalidator)
                )
            )
            .map((data) => [data.address ?? '', data])
        )
        const tokenManagerIds = Object.keys(indexedTokenManagerDatas).reduce(
          (acc, id) => {
            const pubkey = tryPublicKey(id)
            return pubkey ? [...acc, pubkey] : acc
          },
          [] as PublicKey[]
        )
        filterSpan.finish()

        ////
        const tokenManagerSpan = transaction.startChild({
          op: 'fetch-recent-token-managers',
        })
        const tokenManagerDatas = (
          await getTokenManagers(connection, tokenManagerIds)
        ).filter((tm) => tm.parsed)
        tokenManagerSpan.finish()

        ////
        const mintIds = tokenManagerDatas.map(
          (tokenManager) => tokenManager.parsed.mint
        )

        // const metaplexIds = await Promise.all(
        //   tokenManagerDatas.map(
        //     async (tm) =>
        //       (
        //         await metaplex.MetadataProgram.findMetadataAccount(
        //           tm.parsed.mint
        //         )
        //       )[0]
        //   )
        // )
        const metaplexIds = tokenManagerDatas.map((tm) => {
          const indexData = indexedTokenManagerDatas[tm.pubkey.toString()]
          return indexData?.mint_address_nfts?.metadatas_attributes
            ? tryPublicKey(
                indexData.mint_address_nfts.metadatas_attributes[0]
                  ?.metadata_address
              )
            : null
        })
        const editionIds = tokenManagerDatas.map(
          (tm) =>
            tryPublicKey(
              indexedTokenManagerDatas[tm.pubkey.toString()]?.mint_address_nfts
                ?.edition_pda
            ) ?? null
        )
        // const editionIds = await Promise.all(
        //   tokenManagerDatas.map(async (tokenManager) =>
        //     metaplex.Edition.getPDA(tokenManager.parsed.mint)
        //   )
        // )
        const idsToFetch = tokenManagerDatas.reduce(
          (acc, tm) => [
            ...acc,
            tm.parsed.claimApprover,
            ...tm.parsed.invalidators,
            tm.parsed.recipientTokenAccount,
          ],
          [...editionIds, ...mintIds, ...metaplexIds] as (PublicKey | null)[]
        )

        const fetchAccountsSpan = transaction.startChild({
          op: 'fetch-accounts',
        })
        const accountsById = await getAccountDataById(idsToFetch)
        fetchAccountsSpan.finish()

        const tokenDatas = tokenManagerDatas.map((tokenManagerData, i) => {
          const timeInvalidatorId = tokenManagerData.parsed.invalidators.filter(
            (invalidator) =>
              accountsById[invalidator.toString()]?.owner?.toString() ===
              TIME_INVALIDATOR_ADDRESS.toString()
          )[0]
          const useInvalidatorId = tokenManagerData.parsed.invalidators.filter(
            (invalidator) =>
              accountsById[invalidator.toString()]?.owner?.toString() ===
              USE_INVALIDATOR_ADDRESS.toString()
          )[0]
          return {
            mint: accountsById[
              tokenManagerData.parsed.mint.toString()
            ] as AccountData<spl.MintInfo>,
            indexedData:
              indexedTokenManagerDatas[tokenManagerData.pubkey.toString()],
            editionData: accountsById[editionIds[i]!.toString()] as
              | {
                  pubkey: PublicKey
                  parsed: metaplex.EditionData | metaplex.MasterEditionData
                }
              | undefined,
            recipientTokenAccount: tokenManagerData.parsed.recipientTokenAccount
              ? (accountsById[
                  tokenManagerData.parsed.recipientTokenAccount?.toString()
                ] as AccountData<ParsedTokenAccountData>)
              : undefined,
            metaplexData: accountsById[metaplexIds[i]!.toString()] as
              | AccountData<metaplex.MetadataData>
              | undefined,
            tokenManager: tokenManagerData,
            // metadata: metadataById[tokenManagerData.pubkey.toString()],
            claimApprover: tokenManagerData.parsed.claimApprover?.toString()
              ? (accountsById[
                  tokenManagerData.parsed.claimApprover?.toString()
                ] as AccountData<PaidClaimApproverData>)
              : undefined,
            useInvalidator: useInvalidatorId
              ? (accountsById[
                  useInvalidatorId.toString()
                ] as AccountData<UseInvalidatorData>)
              : undefined,
            timeInvalidator: timeInvalidatorId
              ? (accountsById[
                  timeInvalidatorId.toString()
                ] as AccountData<TimeInvalidatorData>)
              : undefined,
          }
        })
        transaction.finish()
        return tokenDatas.filter((tokenData) => elligibleForClaim(tokenData))
      } else {
        let tokenManagerDatas = []
        if (config.filter?.type === 'issuer') {
          // TODO unsafe loop of network calls
          const tokenManagerDatasByIssuer = await Promise.all(
            config.filter.value.map((issuerString) =>
              tryPublicKey(issuerString)
                ? getTokenManagersForIssuer(
                    connection,
                    tryPublicKey(issuerString)!
                  )
                : []
            )
          )
          tokenManagerDatas = tokenManagerDatasByIssuer.flat()
        } else {
          tokenManagerDatas = await getTokenManagersByState(
            connection,
            config.issuedOnly ? TokenManagerState.Issued : null
          )
        }
        const tokenDatas = await getTokenDatas(
          connection,
          tokenManagerDatas,
          config.filter,
          environment.label
        )
        return tokenDatas
      }
    },
    {
      refetchInterval: 20000,
      refetchOnMount: false,
      enabled: !!config,
    }
  )
}
