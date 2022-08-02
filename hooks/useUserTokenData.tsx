import type { AccountData } from '@cardinal/common'
import { getBatchedMultipleAccounts } from '@cardinal/common'
import { tryPublicKey } from '@cardinal/namespaces-components'
import type { PaidClaimApproverData } from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import type { TokenManagerData } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type { UseInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import { Edition } from '@metaplex-foundation/mpl-token-metadata'
import * as Sentry from '@sentry/browser'
import * as spl from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import type { TokenData } from 'apis/api'
import { withTrace } from 'common/trace'
import type { TokenFilter } from 'config/config'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import type { ParsedTokenAccountData } from 'providers/SolanaAccountsProvider'
import { fetchAccountDataById } from 'providers/SolanaAccountsProvider'
import { useQuery } from 'react-query'

import { TOKEN_DATA_KEY } from './useBrowseAvailableTokenDatas'
import { useWalletId } from './useWalletId'

export type UserTokenData = Pick<
  TokenData,
  | 'mint'
  | 'tokenAccount'
  | 'tokenManager'
  | 'metadata'
  | 'metaplexData'
  | 'editionData'
  | 'claimApprover'
  | 'useInvalidator'
  | 'timeInvalidator'
  | 'recipientTokenAccount'
>

export const useUserTokenData = (filter?: TokenFilter) => {
  const walletId = useWalletId()
  const { connection, environment } = useEnvironmentCtx()
  const { config } = useProjectConfig()

  return useQuery<UserTokenData[]>(
    [TOKEN_DATA_KEY, 'useUserTokenData', walletId, filter?.value],
    async () => {
      if (!walletId) return []
      const trace = Sentry.startTransaction({
        name: `[useUserTokenData] ${config.name}`,
      })

      const allTokenAccounts = await withTrace(
        () =>
          connection.getParsedTokenAccountsByOwner(new PublicKey(walletId), {
            programId: spl.TOKEN_PROGRAM_ID,
          }),
        trace,
        { op: 'get-token-accounts' }
      )

      let tokenAccounts = allTokenAccounts.value
        .filter(
          (tokenAccount) =>
            tokenAccount.account.data.parsed.info.tokenAmount.uiAmount > 0
        )
        .sort((a, b) => a.pubkey.toBase58().localeCompare(b.pubkey.toBase58()))
        .map((tokenAccount) => ({
          pubkey: tokenAccount.pubkey,
          parsed: tokenAccount.account.data.parsed
            .info as ParsedTokenAccountData,
        }))

      // lookup metaplex data
      const metaplexIds = await withTrace(
        () =>
          Promise.all(
            tokenAccounts.map(
              async (tokenAccount) =>
                (
                  await metaplex.MetadataProgram.findMetadataAccount(
                    new PublicKey(tokenAccount.parsed.mint)
                  )
                )[0]
            )
          ),
        trace,
        { op: 'collect-metaplex-ids' }
      )
      // TODO use accountDataById?
      const metaplexAccountInfos = await withTrace(
        () => getBatchedMultipleAccounts(connection, metaplexIds),
        trace,
        { op: 'fetch-metaplex-data' }
      )

      const deserializeSpan = trace?.startChild({
        op: 'deserialize-metaplex-data',
      })
      const metaplexData = metaplexAccountInfos.reduce(
        (acc, accountInfo, i) => {
          try {
            acc[tokenAccounts[i]!.pubkey.toString()] = {
              pubkey: metaplexIds[i]!,
              ...accountInfo,
              parsed: metaplex.MetadataData.deserialize(
                accountInfo?.data as Buffer
              ) as metaplex.MetadataData,
            }
          } catch (e) {}
          return acc
        },
        {} as {
          [tokenAccountId: string]: AccountData<metaplex.MetadataData>
        }
      )
      deserializeSpan?.finish()

      // filter by creators
      if (filter?.type === 'creators') {
        tokenAccounts = tokenAccounts.filter((tokenAccount) =>
          metaplexData[
            tokenAccount.pubkey.toString()
          ]?.parsed?.data?.creators?.some(
            (creator) =>
              filter.value.includes(creator.address.toString()) &&
              (environment.label === 'devnet' || creator.verified)
          )
        )
      }

      // lookup delegates and
      const delegateIds = tokenAccounts.map((tokenAccount) =>
        tryPublicKey(tokenAccount.parsed.delegate)
      )
      const tokenAccountDelegateData = await withTrace(
        () => fetchAccountDataById(connection, delegateIds),
        trace,
        { op: 'fetch-delegate-data' }
      )

      // filter by issuer
      if (filter?.type === 'issuer') {
        tokenAccounts = tokenAccounts.filter(
          (tokenAccount) =>
            tokenAccountDelegateData[tokenAccount.parsed.delegate]?.type ===
              'tokenManager' &&
            filter.value.includes(
              (
                tokenAccountDelegateData[
                  tokenAccount.parsed.delegate
                ] as AccountData<TokenManagerData>
              ).parsed.issuer.toString()
            )
        )
      }

      const collectSpan = trace?.startChild({
        op: 'collect-fanout-ids',
      })
      const mintIds = tokenAccounts.map((tokenAccount) =>
        tryPublicKey(tokenAccount.parsed.mint)
      )
      const editionIds = await Promise.all(
        tokenAccounts.map(async (tokenAccount) =>
          Edition.getPDA(tokenAccount.parsed.mint)
        )
      )
      const idsToFetch = Object.values(tokenAccountDelegateData).reduce(
        (acc, accountData) => [
          ...acc,
          ...(accountData.type === 'tokenManager'
            ? [
                (accountData as AccountData<TokenManagerData>).parsed
                  .claimApprover,
                (accountData as AccountData<TokenManagerData>).parsed
                  .recipientTokenAccount,
                ...(accountData as AccountData<TokenManagerData>).parsed
                  .invalidators,
              ]
            : []),
        ],
        [...editionIds, ...mintIds] as (PublicKey | null)[]
      )
      collectSpan.finish()

      const accountsById = {
        ...tokenAccountDelegateData,
        ...(await withTrace(
          () => fetchAccountDataById(connection, idsToFetch),
          trace,
          { op: 'fetch-fanout-accounts' }
        )),
      }

      const metadata = await withTrace(
        () =>
          Promise.all(
            tokenAccounts.map(async (tokenAccount) => {
              try {
                const md = metaplexData[tokenAccount.pubkey.toString()]
                const uri = md?.parsed.data.uri
                if (!md || !uri) {
                  return null
                }
                const json = await fetch(uri).then((r) => r.json())
                return {
                  pubkey: md.pubkey,
                  parsed: json,
                }
              } catch (e) {}
            })
          ),
        trace,
        { op: 'fetch-metadata' }
      )

      trace.finish()
      return tokenAccounts.map((tokenAccount, i) => {
        const delegateData = accountsById[tokenAccount.parsed.delegate]

        let tokenManagerData: AccountData<TokenManagerData> | undefined
        let claimApproverId: PublicKey | undefined
        let timeInvalidatorId: PublicKey | undefined
        let useInvalidatorId: PublicKey | undefined
        if (delegateData?.type === 'tokenManager') {
          tokenManagerData = delegateData as AccountData<TokenManagerData>
          claimApproverId = tokenManagerData.parsed.claimApprover ?? undefined
          timeInvalidatorId = tokenManagerData.parsed.invalidators.filter(
            (invalidator) =>
              accountsById[invalidator.toString()]?.type === 'timeInvalidator'
          )[0]
          useInvalidatorId = tokenManagerData.parsed.invalidators.filter(
            (invalidator) =>
              accountsById[invalidator.toString()]?.type === 'useInvalidator'
          )[0]
        }
        return {
          tokenAccount,
          mint: accountsById[
            tokenAccount.parsed.mint
          ] as AccountData<spl.MintInfo>,
          recipientTokenAccount: tokenManagerData?.parsed.recipientTokenAccount
            ? (accountsById[
                tokenManagerData.parsed.recipientTokenAccount?.toString()
              ] as AccountData<ParsedTokenAccountData>)
            : undefined,
          metaplexData: metaplexData[tokenAccount.pubkey.toString()],
          editionData: accountsById[editionIds[i]!.toString()] as
            | {
                pubkey: PublicKey
                parsed: metaplex.EditionData | metaplex.MasterEditionData
              }
            | undefined,
          metadata: metadata.find((data) =>
            data
              ? data.pubkey.toBase58() ===
                metaplexData[tokenAccount.pubkey.toString()]?.pubkey.toBase58()
              : undefined
          ),
          tokenManager: tokenManagerData,
          claimApprover: claimApproverId
            ? (accountsById[
                claimApproverId.toString()
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
    },
    {
      enabled: !!walletId,
      refetchInterval: 40000,
    }
  )
}
