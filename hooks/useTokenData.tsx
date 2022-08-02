import type { AccountData } from '@cardinal/common'
import type * as spl from '@solana/spl-token'
import type { PublicKey } from '@solana/web3.js'
import type { TokenData } from 'apis/api'
import { getTokenData } from 'apis/api'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useQuery } from 'react-query'

export type SingleTokenData = Omit<TokenData, 'recipientTokenAccount'> & {
  recipientTokenAccount?: AccountData<spl.AccountInfo>
  metadata?: AccountData<any>
}

export const useTokenData = (
  tokenManagerId?: PublicKey,
  refreshInterval?: number
) => {
  const { connection, environment } = useEnvironmentCtx()

  return useQuery<SingleTokenData | undefined>(
    ['useTokenData', tokenManagerId?.toString(), environment],
    async () => {
      if (!tokenManagerId) return
      return getTokenData(connection, tokenManagerId)
    },
    {
      enabled: !!tokenManagerId,
      refetchInterval: refreshInterval || 5000,
    }
  )
}
