import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import { tryPublicKey } from '@cardinal/common'
import { findTimeInvalidatorAddress } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator/pda'
import {
  getTokenManagers,
  getTokenManagersForIssuer,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import { findUseInvalidatorAddress } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator/pda'
import type { PublicKey } from '@solana/web3.js'
import type { TokenData } from 'apis/api'
import { getTokenDatas } from 'apis/api'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useQuery } from 'react-query'

import { TOKEN_DATA_KEY } from './useBrowseAvailableTokenDatas'
import { useWalletId } from './useWalletId'

const INDEX_ENABLED_MANAGE = true

export type ManagedTokenData = Pick<
  TokenData,
  | 'tokenAccount'
  | 'mint'
  | 'tokenManager'
  | 'metaplexData'
  | 'metadata'
  | 'editionData'
  | 'claimApprover'
  | 'useInvalidator'
  | 'timeInvalidator'
  | 'recipientTokenAccount'
>

export const useManagedTokens = () => {
  const walletId = useWalletId()
  const { config } = useProjectConfig()
  const { connection, environment } = useEnvironmentCtx()
  return useQuery<ManagedTokenData[]>(
    [TOKEN_DATA_KEY, 'useManagedTokens', walletId?.toString()],
    async () => {
      if (!walletId) return []
      if (environment.index && INDEX_ENABLED_MANAGE && !config.indexDisabled) {
        const indexer = new ApolloClient({
          uri: environment.index,
          cache: new InMemoryCache({ resultCaching: false }),
        })
        const tokenManagerResponse = await indexer.query({
          query: gql`
            query GetTokenManagersForIssuer($issuer: String!) {
              cardinal_token_managers(where: { issuer: { _eq: $issuer } }) {
                address
                mint
                state
                state_changed_at
                invalidator_address {
                  invalidator
                }
              }
            }
          `,
          variables: {
            issuer: walletId.toBase58(),
          },
        })

        /////
        const knownInvalidators: string[][] = await Promise.all(
          tokenManagerResponse.data['cardinal_token_managers'].map(
            async (data: {
              mint: string
              address: string
            }): Promise<string[]> => {
              const tokenManagerId = tryPublicKey(data.address)
              if (!tokenManagerId) return []
              const [[timeInvalidatorId], [useInvalidatorId]] =
                await Promise.all([
                  findTimeInvalidatorAddress(tokenManagerId),
                  findUseInvalidatorAddress(tokenManagerId),
                ])
              return [
                timeInvalidatorId.toString(),
                useInvalidatorId.toString(),
                walletId.toString(),
              ]
            }
          )
        )

        const tokenManagerIds: PublicKey[] = (
          tokenManagerResponse.data['cardinal_token_managers'] as {
            mint: string
            address: string
            invalidator_address: { invalidator: string }[]
          }[]
        ).reduce((acc, data, i) => {
          const tokenManagerId = tryPublicKey(data.address)
          if (!tokenManagerId) return acc
          let filter = false
          data.invalidator_address.forEach(({ invalidator }) => {
            if (
              !config.showUnknownInvalidators &&
              !knownInvalidators[i]?.includes(invalidator)
            ) {
              filter = true
            }
          })
          return filter ? acc : [...acc, tokenManagerId]
        }, [] as PublicKey[])

        const tokenManagerDatas = await getTokenManagers(
          connection,
          tokenManagerIds
        )

        ////
        const tokenDatas = await getTokenDatas(
          connection,
          tokenManagerDatas,
          config.filter,
          environment.label
        )
        return tokenDatas
      } else {
        const tokenManagerDatas = await getTokenManagersForIssuer(
          connection,
          walletId
        )
        const tokenDatas = await getTokenDatas(
          connection,
          tokenManagerDatas,
          config.filter,
          environment.label
        )
        return tokenDatas
      }
    },
    { enabled: !!walletId, refetchInterval: 40000 }
  )
}
