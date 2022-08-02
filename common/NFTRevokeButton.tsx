import { invalidate } from '@cardinal/token-manager'
import { useWallet } from '@solana/wallet-adapter-react'
import type { TokenData } from 'apis/api'
import { TOKEN_DATA_KEY } from 'hooks/useBrowseAvailableTokenDatas'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useUTCNow } from 'providers/UTCNowProvider'
import { useQueryClient } from 'react-query'

import { ButtonSmall } from './ButtonSmall'
import { shouldBeInvalidated } from './tokenDataUtils'
import { executeTransaction } from './Transactions'
import { asWallet } from './Wallets'

interface NFTRevokeButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: TokenData
}

export const NFTRevokeButton: React.FC<NFTRevokeButtonProps> = ({
  tokenData,
}: NFTRevokeButtonProps) => {
  const wallet = useWallet()
  const { connection } = useEnvironmentCtx()
  const { UTCNow } = useUTCNow()
  const queryClient = useQueryClient()

  return (
    <>
      {((wallet.publicKey &&
        tokenData?.tokenManager?.parsed.invalidators
          .map((i) => i.toString())
          .includes(wallet.publicKey?.toString())) ||
        shouldBeInvalidated(tokenData, UTCNow)) && (
        <ButtonSmall
          disabled={!wallet.connected}
          onClick={async () => {
            tokenData?.tokenManager &&
              (await executeTransaction(
                connection,
                asWallet(wallet),
                await invalidate(
                  connection,
                  asWallet(wallet),
                  tokenData?.tokenManager?.parsed.mint
                ),
                {
                  callback: () => queryClient.removeQueries(TOKEN_DATA_KEY),
                }
              ))
          }}
        >
          Revoke
        </ButtonSmall>
      )}
    </>
  )
}
