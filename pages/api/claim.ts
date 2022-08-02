import {
  withFindOrInitAssociatedTokenAccount,
  withWrapSol,
} from '@cardinal/common'
import { withClaimToken } from '@cardinal/token-manager'
import { BN, utils } from '@project-serum/anchor'
import type { PublicKey } from '@solana/web3.js'
import { Connection, Keypair, Transaction } from '@solana/web3.js'
import { getTokenData } from 'apis/api'
import { getATokenAccountInfo, tryPublicKey } from 'apis/utils'
import { firstParam } from 'common/utils'
import { projectConfigs } from 'config/config'
import { WRAPPED_SOL_MINT } from 'hooks/usePaymentMints'
import type { NextApiHandler } from 'next'
import { ENVIRONMENTS } from 'providers/EnvironmentProvider'

interface GetResponse {
  label: string
  icon: string
}

const get: NextApiHandler<GetResponse> = async (req, res) => {
  const { collection: collectionParam } = req.query
  const config =
    projectConfigs[firstParam(collectionParam)] || projectConfigs['default']!

  const icon = config.logoImage.includes('http')
    ? config.logoImage
    : `https://${req.headers.host}${config.logoImage}`
  res.status(200).send({
    label: config.displayName || config.name || 'Unknown project',
    icon,
  })
}

interface PostResponse {
  transaction?: string
  message?: string
  error?: string
}

const emptyWallet = (accountId: PublicKey) => ({
  signTransaction: async (tx: Transaction) => tx,
  signAllTransactions: async (txs: Transaction[]) => txs,
  publicKey: accountId,
})

const post: NextApiHandler<PostResponse> = async (req, res) => {
  const {
    id: tokenManagerParam,
    cluster: clusterParam,
    collection: collectionParam,
    keypair: keypairParam,
  } = req.query
  const { account } = req.body
  const foundEnvironment = ENVIRONMENTS.find(
    (e) => e.label === (firstParam(clusterParam) || 'mainnet')
  )
  if (!foundEnvironment)
    return res.status(400).json({ error: 'Invalid cluster' })

  const accountId = tryPublicKey(account)
  if (!accountId) return res.status(400).json({ error: 'Invalid account' })

  const config =
    projectConfigs[firstParam(collectionParam)] || projectConfigs['default']!

  const connection = new Connection(foundEnvironment!.primary)

  // get token data
  const tokenManagerId = tryPublicKey(tokenManagerParam)
  const tokenData = await getTokenData(connection, tokenManagerId!)
  if (
    !tokenData.metadata &&
    !tokenData.metaplexData &&
    !tokenData.tokenAccount &&
    !tokenData.tokenManager
  ) {
    return res.status(404).json({ error: 'No token found' })
  }

  // get user payment token account
  let userPaymentTokenAccountData
  if (tokenData?.claimApprover?.parsed.paymentMint) {
    userPaymentTokenAccountData = await getATokenAccountInfo(
      connection,
      tokenData?.claimApprover?.parsed.paymentMint,
      accountId
    )
  }

  // wrap sol if there is payment required
  let transaction = new Transaction()
  const paymentMint =
    tokenData.claimApprover?.parsed.paymentMint ||
    tokenData.timeInvalidator?.parsed.extensionPaymentMint
  if (
    tokenData?.claimApprover?.parsed.paymentAmount &&
    tokenData?.claimApprover.parsed.paymentMint.toString() ===
      WRAPPED_SOL_MINT.toString() &&
    tokenData?.claimApprover.parsed.paymentAmount.gt(new BN(0))
  ) {
    const amountToWrap = tokenData?.claimApprover.parsed.paymentAmount.sub(
      userPaymentTokenAccountData?.amount || new BN(0)
    )
    if (amountToWrap.gt(new BN(0))) {
      await withWrapSol(
        transaction,
        connection,
        emptyWallet(accountId),
        amountToWrap.toNumber()
      )
    }
  }
  if (paymentMint) {
    await withFindOrInitAssociatedTokenAccount(
      transaction,
      connection,
      paymentMint,
      accountId,
      accountId,
      true
    )
  }

  // transaction

  let keypair
  if (keypairParam) {
    keypair = Keypair.fromSecretKey(
      utils.bytes.bs58.decode(firstParam(keypairParam))
    )
  }
  await withClaimToken(
    transaction,
    foundEnvironment.secondary && tokenData?.tokenManager?.parsed.receiptMint
      ? new Connection(foundEnvironment.secondary)
      : new Connection(foundEnvironment.primary),
    emptyWallet(accountId),
    tokenManagerId!,
    {
      otpKeypair: keypair,
    }
  )

  // build transaction
  transaction.feePayer = keypair?.publicKey ?? accountId
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash('max')
  ).blockhash
  keypair && transaction.sign(keypair)
  transaction = Transaction.from(
    transaction.serialize({
      verifySignatures: false,
      requireAllSignatures: false,
    })
  )
  // Serialize and return the unsigned transaction.
  const serialized = transaction.serialize({
    verifySignatures: false,
    requireAllSignatures: false,
  })
  const base64 = serialized.toString('base64')
  res.status(200).send({
    transaction: base64,
    message: `Claiming a ${config.name} NFT`,
  })
}

const index: NextApiHandler<GetResponse | PostResponse> = async (
  request,
  response
) => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', '*')
  response.setHeader('Access-Control-Allow-Headers', '*')
  response.setHeader('Access-Control-Allow-Credentials', 'true')
  if (request.method === 'OPTIONS') {
    return response.status(200).json({})
  }
  if (request.method === 'GET') return get(request, response)
  if (request.method === 'POST') return post(request, response)
  throw new Error(`Unexpected method ${request.method}`)
}

export default index
