import { createMint } from '@cardinal/common'
import {
  CreateMasterEditionV3,
  CreateMetadataV2,
  Creator,
  DataV2,
  MasterEdition,
  Metadata,
} from '@metaplex-foundation/mpl-token-metadata'
import { BN } from '@project-serum/anchor'
import type { Wallet } from '@saberhq/solana-contrib'
import { SignerWallet } from '@saberhq/solana-contrib'
import { useWallet } from '@solana/wallet-adapter-react'
import type { Connection } from '@solana/web3.js'
import { Keypair, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js'
import { notify } from 'common/Notification'
import { asWallet } from 'common/Wallets'
import type { ProjectConfig } from 'config/config'
import { useUserTokenData } from 'hooks/useUserTokenData'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

import { ButtonSmall } from './ButtonSmall'
import { executeTransaction } from './Transactions'

export type AirdropMetadata = { name: string; symbol: string; uri: string }

export async function airdropNFT(
  connection: Connection,
  wallet: Wallet,
  config: ProjectConfig
): Promise<string> {
  const airdropMetadatas = config.airdrops || []
  const randInt = Math.round(Math.random() * (airdropMetadatas.length - 1))
  const metadata: AirdropMetadata | undefined = airdropMetadatas[randInt]
  if (!metadata) throw new Error('No configured airdrops found')
  const tokenCreator = Keypair.generate()
  const fromAirdropSignature = await connection.requestAirdrop(
    tokenCreator.publicKey,
    LAMPORTS_PER_SOL
  )
  await connection.confirmTransaction(fromAirdropSignature)

  const [_masterEditionTokenAccountId, masterEditionMint] = await createMint(
    connection,
    tokenCreator,
    wallet.publicKey,
    1,
    tokenCreator.publicKey
  )

  const masterEditionMetadataId = await Metadata.getPDA(
    masterEditionMint.publicKey
  )
  const metadataTx = new CreateMetadataV2(
    { feePayer: tokenCreator.publicKey },
    {
      metadata: masterEditionMetadataId,
      metadataData: new DataV2({
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        sellerFeeBasisPoints: 10,
        collection: null,
        uses: null,
        creators:
          config.filter?.value && config.filter?.type === 'creators'
            ? config.filter.value
                .map(
                  (c) =>
                    new Creator({
                      address: c,
                      verified: false,
                      share: Math.floor(
                        (1 /
                          ((config.filter ?? { value: [] }).value.length + 1)) *
                          100
                      ),
                    })
                )
                .concat(
                  new Creator({
                    address: tokenCreator.publicKey.toString(),
                    verified: false,
                    share: Math.floor(
                      (1 / (config.filter.value.length + 1)) * 100
                    ),
                  })
                )
            : null,
      }),
      updateAuthority: tokenCreator.publicKey,
      mint: masterEditionMint.publicKey,
      mintAuthority: tokenCreator.publicKey,
    }
  )

  const masterEditionId = await MasterEdition.getPDA(
    masterEditionMint.publicKey
  )
  const masterEditionTx = new CreateMasterEditionV3(
    {
      feePayer: tokenCreator.publicKey,
      recentBlockhash: (await connection.getRecentBlockhash('max')).blockhash,
    },
    {
      edition: masterEditionId,
      metadata: masterEditionMetadataId,
      updateAuthority: tokenCreator.publicKey,
      mint: masterEditionMint.publicKey,
      mintAuthority: tokenCreator.publicKey,
      maxSupply: new BN(1),
    }
  )
  const transaction = new Transaction()
  transaction.instructions = [
    ...metadataTx.instructions,
    ...masterEditionTx.instructions,
  ]

  const txid = await executeTransaction(
    connection,
    new SignerWallet(tokenCreator),
    transaction,
    {
      confirmOptions: { commitment: 'confirmed', maxRetries: 3 },
      notificationConfig: { message: 'Airdrop succesful' },
    }
  )
  console.log(
    `Master edition (${masterEditionId.toString()}) created with metadata (${masterEditionMetadataId.toString()})`
  )
  return txid
}

export const Airdrop = () => {
  const { connection } = useEnvironmentCtx()
  const wallet = useWallet()
  const userTokenData = useUserTokenData()
  const { config } = useProjectConfig()

  return (
    <ButtonSmall
      disabled={!wallet.connected}
      onClick={async () => {
        if (!wallet.connected) return
        try {
          await airdropNFT(connection, asWallet(wallet), config)
          await userTokenData.refetch()
        } catch (e) {
          notify({ message: `Airdrop failed: ${e}`, type: 'error' })
        }
      }}
    >
      Airdrop
    </ButtonSmall>
  )
}

export const AirdropSol = () => {
  const { connection } = useEnvironmentCtx()
  const wallet = useWallet()
  const userTokenData = useUserTokenData()
  const { config } = useProjectConfig()

  return (
    <ButtonSmall
      disabled={!wallet.connected}
      onClick={async () => {
        if (!wallet.publicKey) return
        try {
          await connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL)
          notify({ message: 'Airdropped 1 sol successfully' })
          await userTokenData.refetch()
        } catch (e) {
          notify({ message: `Airdrop failed: ${e}`, type: 'error' })
        }
      }}
    >
      Faucet
    </ButtonSmall>
  )
}
