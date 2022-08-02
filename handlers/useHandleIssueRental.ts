import { tryPublicKey } from '@cardinal/common'
import type { IssueParameters } from '@cardinal/token-manager'
import { issueToken } from '@cardinal/token-manager'
import { findPaymentManagerAddress } from '@cardinal/token-manager/dist/cjs/programs/paymentManager/pda'
import type { InvalidationType } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { TokenManagerKind } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { BN, utils } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js'
import type { TokenData } from 'apis/api'
import { executeAllTransactions } from 'apis/utils'
import { asWallet } from 'common/Wallets'
import { TOKEN_DATA_KEY } from 'hooks/useBrowseAvailableTokenDatas'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import { useMutation, useQueryClient } from 'react-query'
import type { RentalCardConfig } from 'rental-components/components/RentalIssueCard'

export type IssueTxResult = {
  tokenManagerId: PublicKey
  otpKeypair: Keypair | undefined
  tokenData: TokenData
  claimLink: string
  error?: string
  txid?: string
}

export interface HandleIssueRentalParams {
  tokenDatas: TokenData[]
  rentalCardConfig: RentalCardConfig
  //
  paymentAmount?: BN
  paymentMint?: string
  durationSeconds?: number
  maxExpiration?: number
  //
  extensionPaymentMint?: string
  extensionPaymentAmount?: BN
  extensionDurationSeconds?: number
  //
  totalUsages?: number
  invalidationType?: InvalidationType
  visibility?: 'private' | 'public'
  customInvalidator?: string
  disablePartialExtension?: boolean
  claimRentalReceipt?: boolean
}

export const useHandleIssueRental = () => {
  const wallet = useWallet()
  const { config } = useProjectConfig()
  const { connection } = useEnvironmentCtx()
  const queryClient = useQueryClient()
  return useMutation(
    async ({
      tokenDatas,
      rentalCardConfig,
      paymentAmount,
      paymentMint,
      durationSeconds,
      maxExpiration,
      extensionPaymentMint,
      extensionPaymentAmount,
      extensionDurationSeconds,
      totalUsages,
      invalidationType,
      visibility,
      customInvalidator,
      disablePartialExtension,
      claimRentalReceipt,
    }: HandleIssueRentalParams): Promise<IssueTxResult[]> => {
      if (!wallet.publicKey) {
        throw 'Wallet not connected'
      }
      if (maxExpiration && maxExpiration < Date.now() / 1000) {
        throw 'Rental expiration has already passed. Please select a value after the current date.'
      }
      if (visibility === 'private' && tokenDatas.length > 1) {
        throw 'Private rentals can only be made one at a time.'
      }

      if (rentalCardConfig.invalidationOptions?.maxDurationAllowed) {
        if (
          durationSeconds &&
          durationSeconds >
            rentalCardConfig.invalidationOptions?.maxDurationAllowed.value
        ) {
          throw (
            'Duration of rental exceeds max allowed. Max duration allowed is ' +
            rentalCardConfig.invalidationOptions?.maxDurationAllowed.displayText
          )
        }
        if (
          extensionDurationSeconds &&
          extensionDurationSeconds >
            rentalCardConfig.invalidationOptions?.maxDurationAllowed.value
        ) {
          throw (
            'Duration of rental exceeds max allowed. Max duration allowed is ' +
            rentalCardConfig.invalidationOptions?.maxDurationAllowed.displayText
          )
        }
        if (
          maxExpiration &&
          maxExpiration - Date.now() / 1000 >
            rentalCardConfig.invalidationOptions?.maxDurationAllowed.value
        ) {
          throw (
            'Duration of rental exceeds max allowed. Max duration allowed is ' +
            rentalCardConfig.invalidationOptions?.maxDurationAllowed.displayText
          )
        }
      }

      if (
        !customInvalidator &&
        (!durationSeconds || durationSeconds === 0) &&
        (!maxExpiration || maxExpiration === 0)
      ) {
        throw 'Max expiration required'
      }

      const transactions: Transaction[] = []
      const receiptMintKeypairs: Keypair[] = []
      const txData = []
      for (let i = 0; i < tokenDatas.length; i = i + 1) {
        const { tokenAccount, editionData } = tokenDatas[i]!
        if (!tokenAccount) {
          throw 'Token acount not found'
        }
        if (!editionData) {
          throw 'Edition info not found'
        }

        const rentalMint = new PublicKey(tokenAccount?.parsed.mint)
        const receiptMintKeypair = Keypair.generate()
        receiptMintKeypairs.push(receiptMintKeypair)
        const issueParams: IssueParameters = {
          claimPayment:
            paymentAmount && paymentAmount.gt(new BN(0)) && paymentMint
              ? {
                  paymentAmount: paymentAmount.toNumber(),
                  paymentMint: new PublicKey(paymentMint),
                  paymentManager: rentalCardConfig.paymentManager
                    ? tryPublicKey(rentalCardConfig.paymentManager) ||
                      new PublicKey(
                        (
                          await findPaymentManagerAddress(
                            rentalCardConfig.paymentManager
                          )
                        )[0]
                      )
                    : undefined,
                }
              : undefined,
          timeInvalidation:
            !!maxExpiration || !!durationSeconds
              ? {
                  durationSeconds,
                  maxExpiration,
                  extension:
                    extensionPaymentAmount !== undefined &&
                    extensionDurationSeconds !== undefined &&
                    extensionPaymentMint
                      ? {
                          extensionPaymentAmount:
                            extensionPaymentAmount.toNumber(),
                          extensionDurationSeconds,
                          extensionPaymentMint:
                            tryPublicKey(extensionPaymentMint)!,
                          disablePartialExtension,
                        }
                      : undefined,
                  paymentManager: rentalCardConfig.paymentManager
                    ? tryPublicKey(rentalCardConfig.paymentManager) ||
                      new PublicKey(
                        (
                          await findPaymentManagerAddress(
                            rentalCardConfig.paymentManager
                          )
                        )[0]
                      )
                    : undefined,
                }
              : undefined,
          useInvalidation: totalUsages
            ? {
                totalUsages: totalUsages,
                paymentManager: rentalCardConfig.paymentManager
                  ? tryPublicKey(rentalCardConfig.paymentManager) ||
                    new PublicKey(
                      (
                        await findPaymentManagerAddress(
                          rentalCardConfig.paymentManager
                        )
                      )[0]
                    )
                  : undefined,
              }
            : undefined,
          mint: rentalMint,
          issuerTokenAccountId: tokenAccount?.pubkey,
          kind: editionData
            ? TokenManagerKind.Edition
            : TokenManagerKind.Managed,
          invalidationType,
          visibility,
          customInvalidators: customInvalidator
            ? [new PublicKey(customInvalidator)]
            : undefined,
          receiptOptions: claimRentalReceipt
            ? { receiptMintKeypair }
            : undefined,
        }

        console.log('----', issueParams)
        const [issueTransaction, tokenManagerId, otpKeypair] = await issueToken(
          connection,
          asWallet(wallet),
          issueParams
        )

        txData.push({
          tokenManagerId,
          tokenData: tokenDatas[i]!,
          otpKeypair,
        })

        const transaction = new Transaction()
        transaction.instructions = otpKeypair
          ? [
              ...issueTransaction.instructions,
              SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: otpKeypair.publicKey,
                lamports: 0.001 * LAMPORTS_PER_SOL,
              }),
            ]
          : issueTransaction.instructions
        transactions.push(transaction)
      }
      const txResults = await executeAllTransactions(
        connection,
        asWallet(wallet),
        transactions,
        {
          signers: claimRentalReceipt ? [receiptMintKeypairs] : [],
          confirmOptions: {
            maxRetries: 3,
          },
          notificationConfig: {
            successSummary: true,
            message: 'Successfully rented out NFTs',
            description:
              'These NFTs are now available to rent in the browse tab',
          },
        }
      )
      return txData.map((txData, i) => ({
        ...txData,
        error: txResults[i]?.error ?? undefined,
        txid: txResults[i]?.txid ?? undefined,
        otpKeypair: txData.otpKeypair,
        claimLink: getLink(
          `/${config.name}/claim/${txData.tokenManagerId.toString()}${
            txData.otpKeypair
              ? `?otp=${utils.bytes.bs58.encode(txData.otpKeypair.secretKey)}`
              : '?'
          }`
        ),
      }))
    },
    {
      onSuccess: () => {
        queryClient.removeQueries(TOKEN_DATA_KEY)
      },
    }
  )
}
