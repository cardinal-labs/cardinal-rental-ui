import type { AccountData } from '@cardinal/common'
import { firstParam, tryGetAccount, tryPublicKey } from '@cardinal/common'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { getTokenManager } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import { findTokenManagerAddress } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/pda'
import { Connection } from '@solana/web3.js'
import type { NextApiHandler } from 'next'
import { ENVIRONMENTS } from 'providers/EnvironmentProvider'
import { fetchAccountDataById } from 'providers/SolanaAccountsProvider'

interface GetResponse {
  mintId?: string
  rentalInfo?: {
    claimed: boolean
    rentalStart?: string
    durationSeconds?: string
    expiration?: string
    extensionPaymentAmount?: string
    extensionDurationSeconds?: string
    extensionPaymentMint?: string
    maxExpiration?: string
  }
  error?: string
}

const get: NextApiHandler<GetResponse> = async (req, res) => {
  const { mintId, cluster: clusterParam } = req.query
  const mintIdParam = tryPublicKey(mintId)
  if (!mintIdParam)
    return res.status(400).send({
      error: 'Invalid mint id parameter provided',
    })

  const foundEnvironment = ENVIRONMENTS.find(
    (e) => e.label === (firstParam(clusterParam) || 'mainnet')
  )
  if (!foundEnvironment) {
    return res.status(400).json({ error: 'Invalid cluster' })
  }
  const connection = new Connection(foundEnvironment!.primary)

  const [tokenManagerId] = await findTokenManagerAddress(mintIdParam)
  const tokenManagerData = await tryGetAccount(() =>
    getTokenManager(connection, tokenManagerId)
  )
  if (!tokenManagerData) {
    return res
      .status(404)
      .json({ error: 'No rental for given mint id not found' })
  }

  let timeInvalidatorData: AccountData<TimeInvalidatorData> | undefined
  for (const invalidtor of tokenManagerData.parsed.invalidators) {
    const data = await fetchAccountDataById(connection, [invalidtor])
    if (data[invalidtor.toString()]!.type === 'timeInvalidator') {
      console.log('Found rental')
      timeInvalidatorData = data[
        invalidtor.toString()
      ]! as AccountData<TimeInvalidatorData>
      break
    }
  }

  if (timeInvalidatorData) {
    const claimed = tokenManagerData.parsed.state === TokenManagerState.Claimed
    const startDate = claimed
      ? new Date(tokenManagerData.parsed.stateChangedAt.toNumber() * 1000)
      : undefined
    const maxExpirationDate = timeInvalidatorData.parsed.maxExpiration
      ? new Date(timeInvalidatorData.parsed.maxExpiration.toNumber() * 1000)
      : undefined
    return res.status(200).send({
      mintId: mintIdParam?.toString(),
      rentalInfo: {
        claimed: claimed,
        rentalStart: startDate
          ? startDate.toDateString() + ', ' + startDate.toLocaleTimeString()
          : undefined,
        durationSeconds: timeInvalidatorData.parsed.durationSeconds?.toString(),
        expiration: timeInvalidatorData.parsed.expiration?.toString(),
        extensionPaymentAmount:
          timeInvalidatorData.parsed.extensionPaymentAmount?.toString(),
        extensionDurationSeconds:
          timeInvalidatorData.parsed.extensionDurationSeconds?.toString(),
        extensionPaymentMint:
          timeInvalidatorData.parsed.extensionPaymentMint?.toString(),
        maxExpiration: maxExpirationDate
          ? maxExpirationDate.toDateString() +
            ', ' +
            maxExpirationDate.toLocaleTimeString()
          : undefined,
      },
    })
  } else {
    return res
      .status(404)
      .json({ error: 'No rental for given mint id not found' })
  }
}

const index: NextApiHandler<GetResponse> = async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', '*')
  response.setHeader('Access-Control-Allow-Headers', '*')
  response.setHeader('Access-Control-Allow-Credentials', 'true')
  if (request.method === 'OPTIONS') {
    return response.status(200).json({})
  }
  if (request.method === 'GET') return get(request, response)
  throw new Error(
    `Unexpected method ${request.method}. Only GET requests supported`
  )
}

export default index
