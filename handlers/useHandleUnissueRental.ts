import { unissueToken } from '@cardinal/token-manager'
import { useWallet } from '@solana/wallet-adapter-react'
import type { TokenData } from 'apis/api'
import { executeTransaction } from 'common/Transactions'
import { asWallet } from 'common/Wallets'
import { TOKEN_DATA_KEY } from 'hooks/useBrowseAvailableTokenDatas'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useMutation, useQueryClient } from 'react-query'

export interface HandleIssueRentalParams {
  tokenData: TokenData
}

export const useHandleUnissueRental = () => {
  const wallet = useWallet()
  const { connection } = useEnvironmentCtx()
  const queryClient = useQueryClient()
  return useMutation(
    async ({ tokenData }: HandleIssueRentalParams): Promise<string> => {
      if (!tokenData.tokenManager) throw new Error('Invalid token manager')
      if (!wallet.publicKey) throw new Error('Wallet not connected')
      return executeTransaction(
        connection,
        asWallet(wallet),
        await unissueToken(
          connection,
          asWallet(wallet),
          tokenData?.tokenManager?.parsed.mint
        ),
        {
          notificationConfig: {},
        }
      )
    },
    {
      onSuccess: () => {
        queryClient.removeQueries(TOKEN_DATA_KEY)
      },
    }
  )
}
