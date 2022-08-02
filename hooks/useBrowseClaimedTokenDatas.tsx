import type { AccountData } from '@cardinal/common'
import type { PaidClaimApproverData } from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { TIME_INVALIDATOR_ADDRESS } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { getTokenManagers } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import type { UseInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import { USE_INVALIDATOR_ADDRESS } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import type * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import * as Sentry from '@sentry/browser'
import type * as spl from '@solana/spl-token'
import type { PublicKey } from '@solana/web3.js'
import type { TokenData } from 'apis/api'
import { getTokenDatas } from 'apis/api'
import { tryPublicKey } from 'apis/utils'
import { withTrace } from 'common/trace'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import type { ParsedTokenAccountData } from 'providers/SolanaAccountsProvider'
import { useAccounts } from 'providers/SolanaAccountsProvider'
import { useQuery } from 'react-query'

import {
  filterKnownInvalidators,
  getTokenIndexData,
  getTokenManagersWithoutIndex,
  TOKEN_DATA_KEY,
} from './useBrowseAvailableTokenDatas'

export type BrowseClaimedTokenData = Pick<
  TokenData,
  | 'indexedData'
  | 'tokenManager'
  | 'metaplexData'
  | 'claimApprover'
  | 'useInvalidator'
  | 'timeInvalidator'
  | 'recipientTokenAccount'
>

export const useBrowseClaimedTokenDatas = (disabled: boolean) => {
  const state = TokenManagerState.Claimed
  const { config } = useProjectConfig()
  const { connection, environment } = useEnvironmentCtx()
  const { getAccountDataById } = useAccounts()
  return useQuery<BrowseClaimedTokenData[]>(
    [TOKEN_DATA_KEY, 'useBrowseClaimedTokenDatas', config.name],
    async () => {
      if (
        (environment.index && config.filter?.type === 'creators') ||
        (config.filter?.type === 'issuer' && !config.indexDisabled)
      ) {
        const trace = Sentry.startTransaction({
          name: `[useBrowseClaimedTokenDatas] ${config.name}`,
        })

        ////
        const indexedTokenManagers = await getTokenIndexData(
          environment,
          config.filter,
          state,
          trace
        )

        /////
        const { tokenManagerIds, indexedTokenManagerDatas } =
          await filterKnownInvalidators(config, indexedTokenManagers, trace)

        ////
        const tokenManagerDatas = await withTrace(
          async () =>
            (
              await getTokenManagers(connection, tokenManagerIds)
            ).filter((tm) => tm.parsed),
          trace,
          {
            op: 'fetch-recent-token-managers',
          }
        )

        ////
        const metaplexIds = tokenManagerDatas.map((tm) => {
          const indexData = indexedTokenManagerDatas[tm.pubkey.toString()]
          return indexData?.mint_address_nfts?.metadatas_attributes
            ? tryPublicKey(
                indexData.mint_address_nfts.metadatas_attributes[0]
                  ?.metadata_address
              )
            : null
        })
        const idsToFetch = tokenManagerDatas.reduce(
          (acc, tm) => [
            ...acc,
            tm.parsed.claimApprover,
            ...tm.parsed.invalidators,
            tm.parsed.recipientTokenAccount,
          ],
          [...metaplexIds] as (PublicKey | null)[]
        )

        const accountsById = await withTrace(
          () => getAccountDataById(idsToFetch),
          trace,
          { op: 'fetch-accounts' }
        )

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
            indexedData:
              indexedTokenManagerDatas[tokenManagerData.pubkey.toString()],
            tokenManager: tokenManagerData,
            mint: accountsById[tokenManagerData.parsed.mint.toString()] as
              | AccountData<spl.MintInfo>
              | undefined,
            metaplexData: accountsById[metaplexIds[i]!.toString()] as
              | AccountData<metaplex.MetadataData>
              | undefined,
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
            recipientTokenAccount: tokenManagerData.parsed.recipientTokenAccount
              ? (accountsById[
                  tokenManagerData.parsed.recipientTokenAccount?.toString()
                ] as AccountData<ParsedTokenAccountData>)
              : undefined,
          }
        })
        trace.finish()
        return tokenDatas
      } else {
        const trace = Sentry.startTransaction({
          name: `[useBrowseClaimedTokenDatas-non-indexed] ${config.name}`,
        })
        const tokenManagerDatas = await withTrace(
          () => getTokenManagersWithoutIndex(connection, config, state),
          trace,
          { op: 'getTokenManagersWithoutIndex' }
        )
        const tokenDatas = await withTrace(
          () =>
            getTokenDatas(
              connection,
              tokenManagerDatas,
              config.filter,
              environment.label
            ),
          trace,
          { op: 'getTokenDatas' }
        )
        return tokenDatas
      }
    },
    {
      refetchInterval: 30000,
      refetchOnMount: false,
      staleTime: 30000,
      enabled: !!config && !disabled,
    }
  )
}
