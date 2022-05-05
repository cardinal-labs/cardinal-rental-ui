import { unissueToken } from '@cardinal/token-manager'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import styled from '@emotion/styled'
import { useWallet } from '@solana/wallet-adapter-react'
import type { TokenData } from 'api/api'
import { pubKeyUrl } from 'common/utils'
import type { ProjectConfig } from 'config/config'
import { lighten } from 'polished'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import React from 'react'
import { FaEllipsisH } from 'react-icons/fa'
import { FiExternalLink, FiSend } from 'react-icons/fi'
import { IoClose, IoQrCodeOutline } from 'react-icons/io5'
import { getColorByBgColor } from 'rental-components/common/Button'
import { useQRCode } from 'rental-components/QRCodeProvider'
import { useRentalModal } from 'rental-components/RentalModalProvider'

import { NFTOverlay } from './NFTOverlay'
import { Popover, PopoverItem } from './Popover'
import { executeTransaction } from './Transactions'
import { asWallet } from './Wallets'

export const TokensOuter = styled.div`
  display: flex;
  align-items: flex-start;
  max-width: 1480px;
  flex-wrap: wrap;
  margin: 0px auto;
  padding-bottom: 60px;
  gap: 20px;

  @media (max-width: 1224px) {
    justify-content: center;
  }
`

export function NFTPlaceholder() {
  const { config } = useProjectConfig()
  return (
    <div className="w-[280px]">
      <div
        className="flex h-[280px] w-full animate-pulse items-center justify-center rounded-t-md p-0"
        style={{ background: lighten(0.04, config.colors.main) }}
      >
        {/* <div
          className="h-full w-full animate-pulse rounded-md"
          style={{ background: lighten(0.04, config.colors.main) }}
        ></div> */}
      </div>
      <div
        style={{ background: lighten(0.07, config.colors.main) }}
        className={`flex min-h-[82px] w-[280px] flex-col gap-3 rounded-b-md p-3`}
      >
        <div
          className="h-5 w-2/3 animate-pulse rounded-md"
          style={{ background: lighten(0.1, config.colors.main) }}
        ></div>
        <div
          className="h-5 w-1/3 animate-pulse rounded-md"
          style={{ background: lighten(0.1, config.colors.main) }}
        ></div>
      </div>
    </div>
  )
}

export const elligibleForRent = (
  config: ProjectConfig,
  tokenData: TokenData
): boolean => {
  return (
    !config.disableListing &&
    !tokenData.tokenManager &&
    tokenData.tokenAccount?.account.data.parsed.info.state !== 'frozen' &&
    Boolean(tokenData.editionData)
  )
}

interface NFTProps {
  tokenData: TokenData
  onClick?: () => void
}

export function NFT({ tokenData, onClick }: NFTProps) {
  const ctx = useEnvironmentCtx()
  const wallet = useWallet()
  const { show } = useQRCode()
  const rentalModal = useRentalModal()
  const { config } = useProjectConfig()

  const {
    tokenAccount,
    metadata,
    tokenManager,
    timeInvalidator,
    useInvalidator,
  } = tokenData

  return (
    <div
      className="relative w-[280px] z-0"
      style={{
        background: lighten(0.02, config.colors.main),
      }}
    >
      <Popover
        content={
          <div
            className="flex flex-col rounded-md px-1 py-1"
            style={{
              background: lighten(0.07, config.colors.main),
              color: getColorByBgColor(config.colors.main),
            }}
          >
            <PopoverItem>
              <a
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'white',
                }}
                href={pubKeyUrl(
                  tokenManager?.parsed.mint ??
                    tokenAccount?.account.data.parsed.info.mint,
                  ctx.environment.label
                )}
                target="_blank"
                rel="noreferrer"
              >
                View
                <FiExternalLink />
              </a>
            </PopoverItem>
            {!tokenManager && (
              <PopoverItem>
                <div
                  className={`${
                    elligibleForRent(config, tokenData)
                      ? 'cursor-pointer'
                      : 'cursor-default opacity-20'
                  } flex items-center justify-between gap-2`}
                  onClick={() => {
                    elligibleForRent(config, tokenData) &&
                      rentalModal.show(
                        asWallet(wallet),
                        ctx.connection,
                        ctx.environment.label,
                        [tokenData],
                        config.rentalCard
                      )
                  }}
                >
                  Rent
                  <FiSend />
                </div>
              </PopoverItem>
            )}
            {tokenManager?.parsed.issuer.toString() ===
              wallet.publicKey?.toString() && (
              <PopoverItem>
                <div
                  className="flex cursor-pointer items-center justify-between gap-2"
                  onClick={async () =>
                    tokenData?.tokenManager &&
                    executeTransaction(
                      ctx.connection,
                      asWallet(wallet),
                      await unissueToken(
                        ctx.connection,
                        asWallet(wallet),
                        tokenData?.tokenManager?.parsed.mint
                      ),
                      {
                        silent: true,
                      }
                    )
                  }
                >
                  Delist
                  <IoClose />
                </div>
              </PopoverItem>
            )}
            {tokenManager &&
              tokenManager.parsed.state === TokenManagerState.Claimed && (
                <PopoverItem>
                  <div
                    className="flex cursor-pointer items-center justify-between gap-2"
                    onClick={() =>
                      show(
                        ctx.connection,
                        asWallet(wallet),
                        tokenData,
                        ctx.environment.label
                      )
                    }
                  >
                    Scan
                    <IoQrCodeOutline />
                  </div>
                </PopoverItem>
              )}
          </div>
        }
      >
        <div
          // TODO fix this color
          className={`absolute top-[8px] right-[8px] z-50 flex cursor-pointer items-center justify-center rounded-full p-2 text-xl text-white hover:bg-[${lighten(
            0.3,
            config.colors.main
          )}]`}
          style={{
            transition: '0.2s all',
            background: lighten(0.07, config.colors.main),
          }}
          key={tokenAccount?.pubkey.toString()}
        >
          <FaEllipsisH />
        </div>
      </Popover>
      <div
        className={`z-0 flex h-[280px] max-w-full cursor-pointer items-center justify-center`}
        onClick={() => {
          onClick ? onClick() : () => {}
        }}
      >
        {tokenManager && (
          <NFTOverlay
            state={tokenManager?.parsed.state}
            expiration={
              timeInvalidator?.parsed?.expiration?.toNumber() || undefined
            }
            durationSeconds={
              timeInvalidator?.parsed?.durationSeconds?.toNumber() || undefined
            }
            usages={useInvalidator?.parsed.usages.toNumber()}
            totalUsages={useInvalidator?.parsed.totalUsages?.toNumber()}
            lineHeight={14}
            stateChangedAt={
              tokenManager?.parsed.stateChangedAt?.toNumber() || undefined
            }            
          />
        )}
        {metadata && metadata.data && (
          <img
            src={metadata.data.image}
            // src={customImageUri || metadata.data.image}
            alt={metadata.data.name}
            className={`h-full rounded-t-[10px] object-contain`}
          />
        )}
      </div>
    </div>
  )
}
