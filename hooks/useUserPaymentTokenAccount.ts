import type * as splToken from '@solana/spl-token'
import type { PublicKey } from '@solana/web3.js'
import { Connection } from '@solana/web3.js'
import { getATokenAccountInfo } from 'apis/utils'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useQuery } from 'react-query'

import { useWalletId } from './useWalletId'

export const useUserPaymentTokenAccount = (mint: PublicKey | undefined) => {
  const walletId = useWalletId()
  const { environment } = useEnvironmentCtx()
  const connection = new Connection(environment.primary, {
    commitment: 'confirmed',
  })
  return useQuery<splToken.AccountInfo | undefined>(
    ['useUserPaymentTokenAccount', walletId?.toString(), mint?.toString()],
    async () => {
      if (!mint || !walletId) return
      return await getATokenAccountInfo(connection, mint, walletId)
    },
    {}
  )
}
