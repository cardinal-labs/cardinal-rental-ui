import { tryPublicKey } from '@cardinal/common'
import {
  InvalidationType,
  TokenManagerState,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import Tooltip from '@mui/material/Tooltip'
import type { TokenData } from 'apis/api'
import { metadataUrl, pubKeyUrl } from 'common/utils'
import { useHandleReturnRental } from 'handlers/useHandleReturnRental'
import { useHandleUnissueRental } from 'handlers/useHandleUnissueRental'
import { useWalletId } from 'hooks/useWalletId'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import { AiOutlineDatabase } from 'react-icons/ai'
import { BsArrowReturnLeft } from 'react-icons/bs'
import { FaEllipsisH, FaLink } from 'react-icons/fa'
import { FiExternalLink, FiSend } from 'react-icons/fi'
import { IoAddSharp, IoClose, IoQrCodeOutline } from 'react-icons/io5'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'
import { useRentalIssueCard } from 'rental-components/components/RentalIssueCard'
import { useRentalRateCard } from 'rental-components/components/RentalRateCard'
import { useScanCard } from 'rental-components/components/ScanCard'

import { notify } from './Notification'
import { Popover } from './Popover'
import { elligibleForRent, isPrivateListing } from './tokenDataUtils'

export const popoverItemClass = `flex items-center text-light-0 px-2 py-1 rounded-md hover:bg-[rgba(255,255,255,0.1)] gap-2`

export const NFTContexualMenu = ({ tokenData }: { tokenData: TokenData }) => {
  const { environment } = useEnvironmentCtx()
  const { config } = useProjectConfig()
  const walletId = useWalletId()
  const scanCard = useScanCard()
  const rentalRateCard = useRentalRateCard()
  const rentalIssueCard = useRentalIssueCard()
  const handleReturnRental = useHandleReturnRental()
  const handleUnissueRental = useHandleUnissueRental()

  const { tokenManager, tokenAccount, recipientTokenAccount, timeInvalidator } =
    tokenData

  const confirmReturnConfig = (tokenData: TokenData) => {
    if (config.allowOneByCreators && tokenData.tokenManager) {
      const creatorConfig = config.allowOneByCreators.filter(
        (creator) =>
          creator.address === tokenData.tokenManager?.parsed.issuer.toString()
      )
      if (creatorConfig && creatorConfig[0]?.disableReturn) {
        return false
      }
    }
    return true
  }

  return (
    <Popover
      content={
        <div className="flex flex-col rounded-md bg-dark-4 px-1 py-1">
          <a
            className={`${popoverItemClass}`}
            href={pubKeyUrl(
              tokenManager?.parsed.mint ??
                tryPublicKey(tokenAccount?.parsed.mint),
              environment.label
            )}
            target="_blank"
            rel="noreferrer"
          >
            <FiExternalLink />
            View
          </a>
          {environment.label !== 'devnet' && (
            <a
              className={`${popoverItemClass}`}
              href={metadataUrl(
                tokenManager?.parsed.mint ??
                  tryPublicKey(tokenAccount?.parsed.mint),
                environment.label
              )}
              target="_blank"
              rel="noreferrer"
            >
              <AiOutlineDatabase />
              Metadata
            </a>
          )}
          {tokenManager &&
            tokenManager.parsed.state === TokenManagerState.Issued &&
            !isPrivateListing(tokenData) && (
              <a
                className={`${popoverItemClass}`}
                href={getLink(
                  `/${
                    config.name
                  }/claim/${tokenData.tokenManager?.pubkey.toBase58()}`
                )}
                target="_blank"
                rel="noreferrer"
              >
                <FaLink />
                Claim Link
              </a>
            )}
          {!tokenManager && (
            <div
              className={`${popoverItemClass} ${
                elligibleForRent(config, tokenData)
                  ? 'cursor-pointer'
                  : 'cursor-default opacity-20'
              } flex items-center`}
              onClick={(e) => {
                e.stopPropagation()
                elligibleForRent(config, tokenData) &&
                  rentalIssueCard.showModal({
                    tokenDatas: [tokenData],
                  })
              }}
            >
              <FiSend />
              Rent
            </div>
          )}
          {tokenManager &&
            tokenManager?.parsed.issuer.toString() === walletId?.toString() &&
            tokenManager.parsed.state !== TokenManagerState.Claimed && (
              <div
                className={`${popoverItemClass} flex cursor-pointer items-center`}
                onClick={async (e) => {
                  e.stopPropagation()
                  handleUnissueRental.mutate({ tokenData })
                }}
              >
                <IoClose />
                Delist
              </div>
            )}
          {tokenManager &&
            tokenManager.parsed.state === TokenManagerState.Claimed &&
            tokenData.recipientTokenAccount?.parsed.owner.toString() ===
              walletId?.toString() && (
              <div
                className={`${popoverItemClass} flex cursor-pointer items-center`}
                onClick={(e) => {
                  e.stopPropagation()
                  scanCard.showModal({
                    tokenData,
                  })
                }}
              >
                <IoQrCodeOutline />
                Scan
              </div>
            )}
          {recipientTokenAccount?.parsed.owner.toString() ===
            walletId?.toString() &&
            tokenManager &&
            (tokenManager.parsed.invalidationType ===
              InvalidationType.Reissue ||
              tokenManager.parsed.invalidationType ===
                InvalidationType.Return) &&
            confirmReturnConfig(tokenData) && (
              <div
                className={`${popoverItemClass} flex cursor-pointer items-center`}
                onClick={async (e) => {
                  e.stopPropagation()
                  handleReturnRental.mutate(
                    { tokenData },
                    {
                      onError: (e) =>
                        notify({
                          message: `Return failed: ${e}`,
                          type: 'error',
                        }),
                    }
                  )
                }}
              >
                <BsArrowReturnLeft />
                Return
              </div>
            )}
          {recipientTokenAccount?.parsed.owner.toString() ===
            walletId?.toString() &&
            timeInvalidator?.parsed?.extensionDurationSeconds &&
            tokenManager && (
              <div
                className={`${popoverItemClass} flex cursor-pointer items-center`}
                onClick={async (e) => {
                  e.stopPropagation()
                  rentalRateCard.showModal({ tokenData, claim: false })
                }}
              >
                <IoAddSharp />
                Add Duration
              </div>
            )}
        </div>
      }
    >
      <Tooltip placement="bottom-start" title="Quick Actions">
        <div
          className={`absolute top-[8px] right-[8px] z-20 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-dark-4 text-white hover:bg-opacity-60`}
          style={{
            transition: '0.2s all',
          }}
          key={tokenAccount?.pubkey.toString()}
        >
          {handleReturnRental.isLoading || handleUnissueRental.isLoading ? (
            <LoadingSpinner height="26px" />
          ) : (
            <FaEllipsisH />
          )}
        </div>
      </Tooltip>
    </Popover>
  )
}
