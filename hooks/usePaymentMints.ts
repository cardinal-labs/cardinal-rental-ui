import { web3 } from '@project-serum/anchor'
import * as splToken from '@solana/spl-token'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useQuery } from 'react-query'

export const PAYMENT_MINTS = [
  {
    mint: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
  },
  {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    image:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  },
  {
    mint: 'MLKmUCaj1dpBY881aFsrBwR9RUMoKic8SWT3u1q5Nkj',
    symbol: 'MILK',
    image:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/MLKmUCaj1dpBY881aFsrBwR9RUMoKic8SWT3u1q5Nkj/logo.png',
  },
  {
    mint: 'FdviznPoMEakdJ37fikNxhoscyruUHSHNkKyvntSqbuo',
    symbol: 'CATNIP',
    image:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/FdviznPoMEakdJ37fikNxhoscyruUHSHNkKyvntSqbuo/logo.png',
  },
]

export const WRAPPED_SOL_MINT = 'So11111111111111111111111111111111111111112'

export const usePaymentMints = () => {
  const ctx = useEnvironmentCtx()

  return useQuery<{ [name: string]: splToken.MintInfo }>(
    ['usePaymentMints'],
    async () => {
      const paymentMintInfoMap: { [k: string]: splToken.MintInfo } = {}
      for (let i = 0; i < PAYMENT_MINTS.length; i++) {
        try {
          const paymentToken = new splToken.Token(
            ctx.connection,
            new web3.PublicKey(PAYMENT_MINTS[i]!.mint),
            splToken.TOKEN_PROGRAM_ID,
            // @ts-ignore
            null
          )
          const mintInfo = await paymentToken.getMintInfo()
          paymentMintInfoMap[PAYMENT_MINTS[i]!.mint] = mintInfo
        } catch (e: any) {
          console.log(`${e}`)
        }
      }
      return paymentMintInfoMap
    },
    {
      refetchOnMount: false,
    }
  )
}
