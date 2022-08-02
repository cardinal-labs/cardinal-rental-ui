import { withFindOrInitAssociatedTokenAccount } from '@cardinal/token-manager'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction } from '@solana/web3.js'
import type { TokenData } from 'apis/api'
import { Airdrop } from 'common/Airdrop'
import { ButtonSmall } from 'common/ButtonSmall'
import { Card } from 'common/Card'
import { HeaderSlim } from 'common/HeaderSlim'
import { NFT } from 'common/NFT'
import { notify } from 'common/Notification'
import { executeTransaction } from 'common/Transactions'
import { asWallet } from 'common/Wallets'
import { useUserTokenData } from 'hooks/useUserTokenData'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'

function Burn() {
  const ctx = useEnvironmentCtx()
  const wallet = useWallet()
  const userTokenData = useUserTokenData()

  const revokeRental = async (tokenData: TokenData) => {
    const transaction = new Transaction()
    const mintId = tokenData.metaplexData?.parsed.mint
    if (!mintId || !wallet.publicKey) return
    const walletAta = await withFindOrInitAssociatedTokenAccount(
      transaction,
      ctx.connection,
      new PublicKey(mintId),
      wallet.publicKey,
      wallet.publicKey
    )
    const burnAta = await withFindOrInitAssociatedTokenAccount(
      transaction,
      ctx.connection,
      new PublicKey(mintId),
      new PublicKey('cburnbWPAQZMziATsjPoSjqGFA4apFhfVXyL5Qkwftt'),
      wallet.publicKey
    )

    transaction.add(
      Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        walletAta,
        burnAta,
        wallet.publicKey,
        [],
        1
      )
    )

    transaction.add(
      Token.createCloseAccountInstruction(
        TOKEN_PROGRAM_ID,
        walletAta,
        wallet.publicKey,
        wallet.publicKey,
        []
      )
    )

    await executeTransaction(ctx.connection, asWallet(wallet), transaction, {
      silent: false,
      callback: userTokenData.refetch,
      notificationConfig: {},
    })
  }

  const getExpiredTokens = (tokenData: TokenData[]) => {
    const datas = tokenData.filter(
      (token) =>
        token?.metaplexData?.parsed?.data?.uri.includes('api.cardinal.so') &&
        !token.tokenManager &&
        token.tokenAccount?.parsed.state !== 'frozen' &&
        token?.metaplexData?.parsed?.data.name === 'EXPIRED'
    )
    // console.log(datas[0])
    // console.log(datas[1])
    return datas
  }

  const expiredTokens: TokenData[] = getExpiredTokens(userTokenData.data || [])

  return (
    <>
      <HeaderSlim />
      <div className="mx-auto mt-12 max-w-[1634px]">
        {!userTokenData.isFetched ? (
          <div className="flex flex-wrap justify-center gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            <Card skeleton header={<></>} subHeader={<></>} />
            <Card skeleton header={<></>} subHeader={<></>} />
            <Card skeleton header={<></>} subHeader={<></>} />
            <Card skeleton header={<></>} subHeader={<></>} />
            <Card skeleton header={<></>} subHeader={<></>} />
            <Card skeleton header={<></>} subHeader={<></>} />
            <Card skeleton header={<></>} subHeader={<></>} />
            <Card skeleton header={<></>} subHeader={<></>} />
          </div>
        ) : expiredTokens && expiredTokens.length > 0 ? (
          expiredTokens.map((tokenData) => (
            <div key={tokenData.tokenAccount?.pubkey.toString()}>
              <NFT
                key={tokenData?.tokenAccount?.pubkey.toBase58()}
                tokenData={tokenData}
              ></NFT>
              <ButtonSmall
                className="mx-auto mt-3"
                onClick={async () => {
                  try {
                    await revokeRental(tokenData)
                  } catch (e) {
                    notify({
                      message: `Return failed: ${e}`,
                      type: 'error',
                    })
                  }
                }}
              >
                Burn
              </ButtonSmall>
            </div>
          ))
        ) : (
          <div className="white flex w-full flex-col items-center justify-center gap-1">
            <div className="text-white">Wallet empty!</div>
            {ctx.environment.label === 'devnet' && <Airdrop />}
          </div>
        )}
      </div>
    </>
  )
}

export default Burn
