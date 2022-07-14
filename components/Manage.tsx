import { DisplayAddress } from '@cardinal/namespaces-components'
import { invalidate } from '@cardinal/token-manager'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { BN } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { HeaderSlim } from 'common/HeaderSlim'
import { NFT, NFTPlaceholder, TokensOuter } from 'common/NFT'
import { Tag } from 'common/Tags'
import { executeTransaction } from 'common/Transactions'
import { asWallet } from 'common/Wallets'
import { useManagedTokens } from 'hooks/useManagedTokens'
import { lighten } from 'polished'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUTCNow } from 'providers/UTCNowProvider'
import { FaLink } from 'react-icons/fa'
import { AsyncButton } from 'rental-components/common/Button'

import { getDurationText, handleCopy } from './Browse'

export const Manage = () => {
  const { config } = useProjectConfig()
  const { connection, secondaryConnection } = useEnvironmentCtx()
  const wallet = useWallet()
  const tokenManagerByIssuer = useManagedTokens()
  const { UTCNow } = useUTCNow()

  return (
    <>
      <HeaderSlim
        loading={
          tokenManagerByIssuer.isFetched && tokenManagerByIssuer.isFetching
        }
        tabs={[
          {
            name: 'Wallet',
            anchor: wallet.publicKey?.toBase58() || 'wallet',
            disabled: !wallet.connected,
          },
          {
            name: 'Manage',
            anchor: 'manage',
            disabled: !wallet.connected || config.disableListing,
          },
          { name: 'Browse', anchor: 'browse' },
        ]}
      />
      <div className="mt-10">
        <TokensOuter>
          {!tokenManagerByIssuer.isFetched ? (
            <>
              <NFTPlaceholder />
              <NFTPlaceholder />
              <NFTPlaceholder />
              <NFTPlaceholder />
              <NFTPlaceholder />
              <NFTPlaceholder />
            </>
          ) : tokenManagerByIssuer.data &&
            tokenManagerByIssuer.data.length > 0 ? (
            tokenManagerByIssuer.data.map((tokenData) => (
              <div key={tokenData.tokenManager?.pubkey.toString()}>
                <NFT
                  key={tokenData?.tokenManager?.pubkey.toBase58()}
                  tokenData={tokenData}
                />
                {
                  {
                    [TokenManagerState.Initialized]: <>Initiliazed</>,
                    [TokenManagerState.Issued]: (
                      <div
                        style={{
                          background: lighten(0.07, config.colors.main),
                        }}
                        className={`flex min-h-[82px] w-[280px] flex-col rounded-b-md p-3`}
                      >
                        <div
                          className="mb-2 flex w-full cursor-pointer flex-row text-xs font-bold text-white"
                          onClick={() =>
                            handleCopy(
                              getLink(
                                `/claim/${tokenData.tokenManager?.pubkey.toBase58()}`
                              )
                            )
                          }
                        >
                          <p className="flex w-fit overflow-hidden text-ellipsis whitespace-nowrap text-left">
                            {tokenData.metadata?.data?.name}
                          </p>
                          <div className="ml-[6px] mt-[2px] flex w-fit">
                            <FaLink />
                          </div>
                        </div>

                        <div className="flex w-full flex-row justify-between text-xs">
                          {tokenData.timeInvalidator?.parsed ||
                          tokenData.useInvalidator?.parsed ? (
                            <Tag state={TokenManagerState.Issued}>
                              <div className="flex flex-col">
                                <div>{getDurationText(tokenData, UTCNow)}</div>
                                <DisplayAddress
                                  connection={secondaryConnection}
                                  address={
                                    tokenData.tokenManager?.parsed.issuer ||
                                    undefined
                                  }
                                  height="18px"
                                  width="100px"
                                  dark={true}
                                />
                              </div>
                            </Tag>
                          ) : (
                            <div className="my-auto rounded-lg bg-gray-800 px-5 py-2 text-white">
                              Private
                            </div>
                          )}
                        </div>
                      </div>
                    ),
                    [TokenManagerState.Claimed]: (
                      <div
                        style={{
                          background: lighten(0.07, config.colors.main),
                        }}
                        className={`flex min-h-[82px] w-[280px] flex-col rounded-b-md p-3`}
                      >
                        <div
                          className="mb-2 flex w-full cursor-pointer flex-row text-xs font-bold text-white"
                          onClick={() =>
                            handleCopy(
                              getLink(
                                `/claim/${tokenData.tokenManager?.pubkey.toBase58()}`
                              )
                            )
                          }
                        >
                          <p className="flex w-fit overflow-hidden text-ellipsis whitespace-nowrap text-left">
                            {tokenData.metadata?.data?.name}
                          </p>
                          <div className="ml-[6px] mt-[2px] flex w-fit">
                            <span className="flex w-full text-left">
                              <FaLink />
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-row justify-between text-xs">
                          {tokenData.recipientTokenAccount?.owner && (
                            <Tag state={TokenManagerState.Claimed}>
                              <div className="flex flex-col">
                                <div className="flex">
                                  <span className="inline-block">
                                    Claimed by&nbsp;
                                  </span>
                                  <DisplayAddress
                                    style={{
                                      color: '#52c41a !important',
                                      display: 'inline',
                                    }}
                                    connection={secondaryConnection}
                                    address={
                                      new PublicKey(
                                        tokenData.recipientTokenAccount?.owner
                                      )
                                    }
                                    height="18px"
                                    width="100px"
                                    dark={true}
                                  />
                                </div>
                                <div className="flex">
                                  <span className="inline-block">
                                    Issued by&nbsp;
                                  </span>
                                  <DisplayAddress
                                    style={{
                                      color: '#52c41a !important',
                                      display: 'inline',
                                    }}
                                    connection={secondaryConnection}
                                    address={
                                      tokenData.tokenManager?.parsed.issuer
                                    }
                                    height="18px"
                                    width="100px"
                                    dark={true}
                                  />
                                </div>
                              </div>
                            </Tag>
                          )}
                          {((wallet.publicKey &&
                            tokenData?.tokenManager?.parsed.invalidators &&
                            tokenData?.tokenManager?.parsed.invalidators
                              .map((i: PublicKey) => i.toString())
                              .includes(wallet.publicKey?.toString())) ||
                            (tokenData.timeInvalidator &&
                              tokenData.timeInvalidator.parsed.expiration &&
                              tokenData.timeInvalidator.parsed.expiration.lte(
                                new BN(Date.now() / 1000)
                              )) ||
                            (tokenData.useInvalidator &&
                              tokenData.useInvalidator.parsed.maxUsages &&
                              tokenData.useInvalidator.parsed.usages.gte(
                                tokenData.useInvalidator.parsed.maxUsages
                              ))) && (
                            <AsyncButton
                              variant="primary"
                              disabled={!wallet.connected}
                              handleClick={async () => {
                                tokenData?.tokenManager &&
                                  executeTransaction(
                                    connection,
                                    asWallet(wallet),
                                    await invalidate(
                                      connection,
                                      asWallet(wallet),
                                      tokenData?.tokenManager?.parsed.mint
                                    ),
                                    {
                                      callback: tokenManagerByIssuer.refetch,
                                      silent: true,
                                    }
                                  )
                              }}
                            >
                              Revoke
                            </AsyncButton>
                          )}
                        </div>
                      </div>
                    ),
                    [TokenManagerState.Invalidated]: (
                      <Tag state={TokenManagerState.Invalidated}>
                        Invalidated
                      </Tag>
                    ),
                  }[tokenData?.tokenManager?.parsed.state as TokenManagerState]
                }
              </div>
            ))
          ) : (
            <div className="white flex w-full flex-col items-center justify-center gap-1">
              <div className="text-gray-500">
                No outstanding {config.displayName} rentals found...
              </div>
            </div>
          )}
        </TokensOuter>
      </div>
    </>
  )
}
