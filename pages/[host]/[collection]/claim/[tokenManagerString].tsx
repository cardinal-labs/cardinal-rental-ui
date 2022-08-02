import { tryPublicKey } from '@cardinal/common'
import { Connection } from '@solana/web3.js'
import { getTokenData } from 'apis/api'
import Claim from 'components/Claim'
import { ENVIRONMENTS } from 'providers/EnvironmentProvider'

function ClaimHome(props: { tokenDataString: string }) {
  return <Claim {...props} />
}

export async function getServerSideProps(context: any) {
  const query = context.query
  const tokenManagerString = query.tokenManagerString
  const cluster = (query.project || query.host)?.includes('dev')
    ? 'devnet'
    : query.host?.includes('test')
    ? 'testnet'
    : query.cluster || process.env.BASE_CLUSTER || 'mainnet'
  console.log(process.env.BASE_CLUSTER)
  const foundEnvironment = ENVIRONMENTS.find((e) => e.label === cluster)
  const environment = foundEnvironment ?? ENVIRONMENTS[0]!
  const connection = new Connection(environment.primary, {
    commitment: 'recent',
  })

  const tokenManagerId = tryPublicKey(tokenManagerString)
  if (!tokenManagerId) {
    return {}
  }
  const tokenData = await getTokenData(connection, tokenManagerString)

  return {
    props: {
      tokenDataString: JSON.stringify(tokenData),
    },
  }
}

export default ClaimHome
