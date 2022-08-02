import type { Wallet } from '@saberhq/solana-contrib'
import * as Sentry from '@sentry/browser'
import * as splToken from '@solana/spl-token'
import type { Connection } from '@solana/web3.js'
import * as web3 from '@solana/web3.js'
import { notify } from 'common/Notification'

import { handleError } from './errors'

export async function getATokenAccountInfo(
  connection: Connection,
  mint: web3.PublicKey,
  owner: web3.PublicKey
): Promise<splToken.AccountInfo> {
  const aTokenAccount = await splToken.Token.getAssociatedTokenAddress(
    splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    splToken.TOKEN_PROGRAM_ID,
    mint,
    owner
  )
  const token = new splToken.Token(
    connection,
    mint,
    splToken.TOKEN_PROGRAM_ID,
    // @ts-ignore
    null
  )
  return token.getAccountInfo(aTokenAccount)
}

export const tryPublicKey = (
  publicKeyString: string | string[] | undefined | null
): web3.PublicKey | null => {
  if (!publicKeyString) return null
  try {
    return new web3.PublicKey(publicKeyString)
  } catch (e) {
    return null
  }
}

export const executeAllTransactions = async (
  connection: Connection,
  wallet: Wallet,
  transactions: web3.Transaction[],
  config: {
    throwIndividualError?: boolean
    signers?: web3.Signer[][]
    confirmOptions?: web3.ConfirmOptions
    notificationConfig?: {
      individualSuccesses?: boolean
      successSummary?: boolean
      message?: string
      errorMessage?: string
      description?: string
    }
  }
): Promise<{ txid?: string | null; error?: string | null }[]> => {
  if (transactions.length === 0) return []

  const recentBlockhash = (await connection.getRecentBlockhash('max')).blockhash
  for (const tx of transactions) {
    tx.feePayer = wallet.publicKey
    tx.recentBlockhash = recentBlockhash
  }
  await wallet.signAllTransactions(transactions)

  const txResults = await Promise.all(
    transactions.map(async (tx, index) => {
      try {
        if (
          config.signers &&
          config.signers.length > 0 &&
          config.signers[index]
        ) {
          tx.partialSign(...config.signers[index]!)
        }
        const txid = await web3.sendAndConfirmRawTransaction(
          connection,
          tx.serialize(),
          config.confirmOptions
        )
        config.notificationConfig &&
          config.notificationConfig.individualSuccesses &&
          notify({
            message: `${config.notificationConfig.message} ${index + 1}/${
              transactions.length
            }`,
            description: config.notificationConfig.message,
            txid,
          })
        return { txid }
      } catch (e) {
        console.log(
          'Failed transaction: ',
          e,
          (e as web3.SendTransactionError).logs
        )
        const errorMessage = handleError(e, `${e}`)
        console.log(errorMessage)
        Sentry.captureException(e, {
          tags: { type: 'transaction', wallet: wallet.publicKey.toString() },
          extra: { errorMessage },
        })
        config.notificationConfig &&
          notify({
            message: `${
              config.notificationConfig.errorMessage ?? 'Failed transaction'
            } ${index + 1}/${transactions.length}`,
            description: config.notificationConfig.errorMessage ?? errorMessage,
            txid: '',
            type: 'error',
          })
        if (config.throwIndividualError) throw new Error(`${e}`)
        return {
          txid: null,
          error: config.notificationConfig?.errorMessage ?? errorMessage,
        }
      }
    })
  )
  console.log('txResults', txResults)
  const successfulTxids = txResults.filter(({ txid }) => txid)
  config.notificationConfig &&
    successfulTxids.length > 0 &&
    notify({
      message: `${config.notificationConfig.message} ${successfulTxids.length}/${transactions.length}`,
      description: config.notificationConfig.description,
      // Consider linking all transactions
      txid: '',
    })
  return txResults
}
