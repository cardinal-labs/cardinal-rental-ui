import { getBatchedMultipleAccounts } from '@cardinal/common'
import { scan } from '@cardinal/scanner/dist/cjs/programs/cardinalScanner'
import type { AccountData } from '@cardinal/token-manager'
import type { PaidClaimApproverData } from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { close } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator/instruction'
import type { TokenManagerData } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type { UseInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import { incrementUsages } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator/instruction'
import * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import { Edition } from '@metaplex-foundation/mpl-token-metadata'
import { utils } from '@project-serum/anchor'
import * as spl from '@solana/spl-token'
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js'
import { tryPublicKey } from 'apis/utils'
import { firstParam } from 'common/utils'
import type { TokenFilter } from 'config/config'
import { projectConfigs } from 'config/config'
import type { NextApiHandler } from 'next'
import { ENVIRONMENTS } from 'providers/EnvironmentProvider'
import { fetchAccountDataById } from 'providers/SolanaAccountsProvider'

export type ScanTokenData = {
  tokenAccount?: AccountData<spl.AccountInfo>
  tokenManager?: AccountData<TokenManagerData>
  metaplexData?: AccountData<metaplex.MetadataData>
  claimApprover?: AccountData<PaidClaimApproverData> | null
  useInvalidator?: AccountData<UseInvalidatorData> | null
  timeInvalidator?: AccountData<TimeInvalidatorData> | null
}

export async function getScanTokenAccounts(
  connection: Connection,
  addressId: string,
  filter?: TokenFilter,
  cluster?: string
): Promise<ScanTokenData[]> {
  const allTokenAccounts = await connection.getParsedTokenAccountsByOwner(
    new PublicKey(addressId),
    { programId: spl.TOKEN_PROGRAM_ID }
  )
  let tokenAccounts = allTokenAccounts.value
    .filter(
      (tokenAccount) =>
        tokenAccount.account.data.parsed.info.tokenAmount.uiAmount > 0
    )
    .sort((a, b) => a.pubkey.toBase58().localeCompare(b.pubkey.toBase58()))

  // lookup metaplex data
  const metaplexIds = await Promise.all(
    tokenAccounts.map(
      async (tokenAccount) =>
        (
          await metaplex.MetadataProgram.findMetadataAccount(
            new PublicKey(tokenAccount.account.data.parsed.info.mint)
          )
        )[0]
    )
  )
  // const metaplexMetadatas = await accountDataById(connection, metaplexIds)
  // TODO use accountDataById?
  const metaplexAccountInfos = await getBatchedMultipleAccounts(
    connection,
    metaplexIds
  )
  const metaplexData = metaplexAccountInfos.reduce((acc, accountInfo, i) => {
    try {
      acc[tokenAccounts[i]!.pubkey.toString()] = {
        pubkey: metaplexIds[i]!,
        ...accountInfo,
        parsed: metaplex.MetadataData.deserialize(
          accountInfo?.data as Buffer
        ) as metaplex.MetadataData,
      }
    } catch (e) {}
    return acc
  }, {} as { [tokenAccountId: string]: { pubkey: PublicKey; parsed: metaplex.MetadataData } })

  // filter by creators
  if (filter?.type === 'creators') {
    tokenAccounts = tokenAccounts.filter((tokenAccount) =>
      metaplexData[
        tokenAccount.pubkey.toString()
      ]?.parsed?.data?.creators?.some(
        (creator) =>
          filter.value.includes(creator.address.toString()) &&
          (cluster === 'devnet' || creator.verified)
      )
    )
  }

  // lookup delegates and
  const delegateIds = tokenAccounts.map((tokenAccount) =>
    tryPublicKey(tokenAccount.account.data.parsed.info.delegate)
  )
  const tokenAccountDelegateData = await fetchAccountDataById(
    connection,
    delegateIds
  )
  const editionIds = await Promise.all(
    tokenAccounts.map(async (tokenAccount) =>
      Edition.getPDA(tokenAccount.account.data.parsed.info.mint)
    )
  )
  const idsToFetch = Object.values(tokenAccountDelegateData).reduce(
    (acc, accountData) => [
      ...acc,
      ...(accountData.type === 'tokenManager'
        ? [
            (accountData as AccountData<TokenManagerData>).parsed.claimApprover,
            (accountData as AccountData<TokenManagerData>).parsed
              .recipientTokenAccount,
            ...(accountData as AccountData<TokenManagerData>).parsed
              .invalidators,
          ]
        : []),
    ],
    [...editionIds] as (PublicKey | null)[]
  )

  const accountsById = {
    ...tokenAccountDelegateData,
    ...(await fetchAccountDataById(connection, idsToFetch)),
  }

  return tokenAccounts.reduce((acc, tokenAccount, i) => {
    const delegateData =
      accountsById[tokenAccount.account.data.parsed.info.delegate]

    let tokenManagerData: AccountData<TokenManagerData> | undefined
    let claimApproverId: PublicKey | undefined
    let timeInvalidatorId: PublicKey | undefined
    let useInvalidatorId: PublicKey | undefined
    if (delegateData?.type === 'tokenManager') {
      tokenManagerData = delegateData as AccountData<TokenManagerData>
      claimApproverId = tokenManagerData.parsed.claimApprover ?? undefined
      timeInvalidatorId = tokenManagerData.parsed.invalidators.filter(
        (invalidator) =>
          accountsById[invalidator.toString()]?.type === 'timeInvalidator'
      )[0]
      useInvalidatorId = tokenManagerData.parsed.invalidators.filter(
        (invalidator) =>
          accountsById[invalidator.toString()]?.type === 'useInvalidator'
      )[0]
    }
    if (
      filter?.type === 'issuer' &&
      !filter.value.includes(tokenManagerData?.parsed?.issuer?.toString() ?? '')
    ) {
      return acc
    }
    return [
      ...acc,
      {
        tokenAccount: {
          pubkey: tokenAccount.pubkey,
          parsed: tokenAccount.account.data.parsed,
        },
        metaplexData: metaplexData[tokenAccount.pubkey.toString()],
        tokenManager: tokenManagerData,
        claimApprover: claimApproverId
          ? (accountsById[
              claimApproverId.toString()
            ] as AccountData<PaidClaimApproverData>)
          : undefined,
        useInvalidator: useInvalidatorId
          ? (accountsById[
              useInvalidatorId.toString()
            ] as AccountData<UseInvalidatorData>)
          : undefined,
        timeInvalidator: timeInvalidatorId
          ? (accountsById[
              timeInvalidatorId.toString()
            ] as AccountData<TimeInvalidatorData>)
          : undefined,
      },
    ]
  }, [] as ScanTokenData[])
}
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

const post: NextApiHandler<PostResponse> = async (req, res) => {
  const {
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

  const keypair = Keypair.fromSecretKey(
    utils.bytes.bs58.decode(firstParam(keypairParam))
  )
  const accountId = tryPublicKey(account)
  if (!accountId) return res.status(400).json({ error: 'Invalid account' })

  const connection = new Connection(foundEnvironment!.primary)
  const config =
    projectConfigs[firstParam(collectionParam)] || projectConfigs['default']!

  let tokenDatas: ScanTokenData[] = []
  try {
    tokenDatas = await getScanTokenAccounts(
      connection,
      accountId.toString(),
      config.filter,
      foundEnvironment.label
    )
  } catch (e) {
    console.log('Failed to get toke accounts: ', e)
    return res.status(500).json({ error: 'Failed to get token accounts' })
  }

  const foundToken =
    tokenDatas.find((tk) => !tk.timeInvalidator && !tk.useInvalidator) ||
    tokenDatas.find((tk) => tk.timeInvalidator) ||
    tokenDatas.find((tk) => tk.useInvalidator)

  if (!foundToken) {
    return res.status(404).json({
      error: `No valid tokens found in wallet for config ${config.name}`,
    })
  }

  let transaction = new Transaction()
  if (!foundToken.timeInvalidator && !foundToken.useInvalidator) {
    const instruction = scan(
      connection,
      {
        signTransaction: async (tx: Transaction) => tx,
        signAllTransactions: async (txs: Transaction[]) => txs,
        publicKey: accountId,
      },
      accountId
    )
    transaction.instructions = [
      {
        ...instruction,
        keys: [
          ...instruction.keys,
          { pubkey: keypair.publicKey, isSigner: false, isWritable: false },
        ],
      },
    ]
  } else if (foundToken.timeInvalidator) {
    const instruction = close(
      connection,
      {
        signTransaction: async (tx: Transaction) => tx,
        signAllTransactions: async (txs: Transaction[]) => txs,
        publicKey: accountId,
      },
      foundToken.timeInvalidator!.pubkey,
      foundToken.tokenManager!.pubkey
    )
    transaction.instructions = [
      {
        ...instruction,
        keys: [
          ...instruction.keys,
          { pubkey: keypair.publicKey, isSigner: false, isWritable: false },
        ],
      },
    ]
  } else if (foundToken.useInvalidator) {
    const instruction = await incrementUsages(
      connection,
      {
        signTransaction: async (tx: Transaction) => tx,
        signAllTransactions: async (txs: Transaction[]) => txs,
        publicKey: accountId,
      },
      foundToken.tokenManager!.pubkey,
      foundToken.tokenAccount!.pubkey,
      1
    )
    transaction.instructions = [
      {
        ...instruction,
        keys: [
          ...instruction.keys,
          { pubkey: keypair.publicKey, isSigner: false, isWritable: false },
        ],
      },
    ]
  }

  transaction.feePayer = accountId
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash('max')
  ).blockhash
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
    message: `Verifying ownership of a ${config.name} NFT`,
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
