import { withResetExpiration, withReturn } from '@cardinal/token-manager'
import { useWallet } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'
import type { TokenData } from 'apis/api'
import { executeTransaction } from 'common/Transactions'
import { asWallet } from 'common/Wallets'
import { TOKEN_DATA_KEY } from 'hooks/useBrowseAvailableTokenDatas'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useMutation, useQueryClient } from 'react-query'

export interface HandleIssueRentalParams {
  tokenData: TokenData
}

export const useHandleReturnRental = () => {
  const wallet = useWallet()
  const { connection } = useEnvironmentCtx()
  const queryClient = useQueryClient()
  return useMutation(
    async ({ tokenData }: HandleIssueRentalParams): Promise<string> => {
      if (!tokenData.tokenManager) throw new Error('Invalid token manager')
      if (!wallet.publicKey) throw new Error('Wallet not connected')

      const transaction = new Transaction()

      await withReturn(
        transaction,
        connection,
        asWallet(wallet),
        tokenData.tokenManager
      )

      if (tokenData.timeInvalidator) {
        await withResetExpiration(
          transaction,
          connection,
          asWallet(wallet),
          tokenData.tokenManager?.pubkey
        )
      }

      return executeTransaction(connection, asWallet(wallet), transaction, {
        silent: false,
        confirmOptions: {
          commitment: 'confirmed',
          maxRetries: 3,
        },
        notificationConfig: {},
      })
    },
    {
      onSuccess: () => {
        queryClient.removeQueries(TOKEN_DATA_KEY)
      },
    }
  )
}
