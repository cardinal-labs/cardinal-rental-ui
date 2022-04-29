import { getTokenManagersForIssuer } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import { Connection } from '@solana/web3.js'
import { getTokenDatas } from 'api/api'
import { tryPublicKey } from 'api/utils'
import { firstParam } from 'common/utils'
import { projectConfigs } from 'config/config'
import type { NextApiRequest, NextApiResponse } from 'next'
import { ENVIRONMENTS } from 'providers/EnvironmentProvider'
import { filterTokens } from 'providers/ProjectConfigProvider'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    cluster: clusterParam,
    issuer: issuerParam,
    collection: collectionParam,
  } = req.query
  const foundEnvironment = ENVIRONMENTS.find(
    (e) => e.label === firstParam(clusterParam) ?? 'mainnet'
  )
  const issuerId = tryPublicKey(firstParam(issuerParam))
  if (!issuerId) return res.status(400).json({ error: 'Invalid issuer' })
  if (!foundEnvironment)
    return res.status(400).json({ error: 'Invalid cluster' })

  const connection = new Connection(foundEnvironment!.value)
  const tokenManagerDatas = await getTokenManagersForIssuer(
    connection,
    issuerId
  )

  let tokenDatas = await getTokenDatas(connection, tokenManagerDatas)
  if (collectionParam) {
    const config =
      projectConfigs[firstParam(collectionParam)] || projectConfigs['default']!
    tokenDatas = filterTokens(
      firstParam(clusterParam),
      config.filters,
      tokenDatas
    )
  }
  res.status(200).json({ data: tokenDatas })
}
