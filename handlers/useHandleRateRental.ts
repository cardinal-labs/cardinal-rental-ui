import type { AccountData } from '@cardinal/common'
import {
  withFindOrInitAssociatedTokenAccount,
  withWrapSol,
} from '@cardinal/common'
import {
  withClaimToken,
  withExtendExpiration,
  withResetExpiration,
} from '@cardinal/token-manager'
import type { PaidClaimApproverData } from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import type { TokenManagerData } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type * as splToken from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import type { Keypair } from '@solana/web3.js'
import { Connection, Transaction } from '@solana/web3.js'
import { executeTransaction } from 'common/Transactions'
import { asWallet } from 'common/Wallets'
import { TOKEN_DATA_KEY } from 'hooks/useBrowseAvailableTokenDatas'
import { WRAPPED_SOL_MINT } from 'hooks/usePaymentMints'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useMutation, useQueryClient } from 'react-query'

export interface HandleRateRentalParams {
  tokenData: {
    claimApprover?: AccountData<PaidClaimApproverData> | null
    tokenManager?: AccountData<TokenManagerData> | null
    timeInvalidator?: AccountData<TimeInvalidatorData> | null
  }
  extensionSeconds: number | undefined | null
  userPaymentTokenAccount?: splToken.AccountInfo
  otpKeypair?: Keypair
  claim?: boolean
}

export const useHandleRateRental = () => {
  const wallet = useWallet()
  const { connection, environment } = useEnvironmentCtx()
  const queryClient = useQueryClient()
  return useMutation(
    async ({
      claim,
      tokenData,
      extensionSeconds,
      userPaymentTokenAccount,
      otpKeypair,
    }: HandleRateRentalParams): Promise<string> => {
      const {
        extensionPaymentMint,
        extensionPaymentAmount,
        extensionDurationSeconds,
      } = tokenData.timeInvalidator?.parsed || {}

      if (!tokenData.tokenManager) throw 'Token manager not found'
      if (!extensionSeconds) throw 'No duration specified'
      if (!wallet.publicKey) throw 'Wallet not connected'
      const transaction = new Transaction()

      // wrap sol if there is payment required
      const paymentAmount =
        (tokenData?.claimApprover?.parsed.paymentAmount.toNumber() ?? 0) +
        ((extensionPaymentAmount?.toNumber() ?? 0) /
          (extensionDurationSeconds?.toNumber() ?? 0)) *
          extensionSeconds
      if (
        extensionPaymentMint?.toString() === WRAPPED_SOL_MINT.toString() &&
        paymentAmount > 0
      ) {
        const amountToWrap =
          paymentAmount - (userPaymentTokenAccount?.amount.toNumber() || 0)
        if (amountToWrap > 0) {
          await withWrapSol(
            transaction,
            connection,
            asWallet(wallet),
            amountToWrap
          )
        }
      }

      if (
        extensionPaymentMint &&
        (extensionPaymentMint?.toString() !== WRAPPED_SOL_MINT.toString() ||
          (transaction.instructions.length === 0 &&
            extensionPaymentMint?.toString() === WRAPPED_SOL_MINT.toString()))
      ) {
        await withFindOrInitAssociatedTokenAccount(
          transaction,
          connection,
          extensionPaymentMint,
          wallet.publicKey,
          wallet.publicKey
        )
      }

      console.log(
        `${claim ? 'Claiming' : 'Extending'} token manager`,
        tokenData
      )
      if (claim) {
        if (tokenData.timeInvalidator) {
          await withResetExpiration(
            transaction,
            connection,
            asWallet(wallet),
            tokenData.tokenManager?.pubkey
          )
        }
        await withClaimToken(
          transaction,
          environment.secondary
            ? new Connection(environment.secondary)
            : connection,
          asWallet(wallet),
          tokenData.tokenManager?.pubkey,
          {
            otpKeypair: otpKeypair,
          }
        )
      }

      await withExtendExpiration(
        transaction,
        connection,
        asWallet(wallet),
        tokenData.tokenManager?.pubkey,
        extensionSeconds
      )

      return await executeTransaction(
        connection,
        asWallet(wallet),
        transaction,
        {
          confirmOptions: {
            commitment: 'confirmed',
            maxRetries: 3,
          },
          signers: otpKeypair ? [otpKeypair] : [],
          notificationConfig: {},
        }
      )
    },
    {
      onError: async (e) => {
        console.log('[error][useHandleRateRental]', e)
        return e
      },
      onSuccess: () => {
        queryClient.removeQueries(TOKEN_DATA_KEY)
      },
    }
  )
}
