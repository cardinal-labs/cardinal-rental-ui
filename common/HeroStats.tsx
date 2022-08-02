import { secondsToString } from '@cardinal/common'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type * as splToken from '@solana/spl-token'
import type { TokenData } from 'apis/api'
import type { ProjectConfig } from 'config/config'
import { useBrowseAvailableTokenDatas } from 'hooks/useBrowseAvailableTokenDatas'
import { usePaymentMints } from 'hooks/usePaymentMints'
import { useProjectStats } from 'hooks/useProjectStats'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

import { DURATION_DATA } from './DurationInput'
import {
  getPriceFromTokenData,
  getSymbolFromTokenData,
  isPrivateListing,
  isRateBasedListing,
} from './tokenDataUtils'
import { getMintDecimalAmount } from './units'

const calculateFloorPrice = (
  tokenDatas: Pick<
    TokenData,
    'tokenManager' | 'claimApprover' | 'timeInvalidator'
  >[],
  config: ProjectConfig,
  paymentMints: { [name: string]: splToken.MintInfo } | undefined
): number => {
  const onlyRateTokens = (tokenData: Pick<TokenData, 'timeInvalidator'>) => {
    if (config.marketplaceRate) {
      return (
        tokenData.timeInvalidator?.parsed?.durationSeconds?.toNumber() === 0
      )
    } else {
      return false
    }
  }

  const rentalPrices = tokenDatas
    .filter(
      (tokenData) =>
        tokenData.timeInvalidator?.parsed &&
        tokenData.tokenManager?.parsed.state === TokenManagerState.Issued &&
        onlyRateTokens(tokenData) &&
        !isPrivateListing(tokenData)
    )
    .map((tokenData) => {
      let price = 0
      let duration = 0
      if (paymentMints && tokenData.timeInvalidator?.parsed) {
        if (isRateBasedListing(tokenData)) {
          if (
            tokenData.timeInvalidator.parsed.extensionPaymentAmount &&
            tokenData.timeInvalidator.parsed.extensionDurationSeconds &&
            tokenData.timeInvalidator?.parsed?.extensionPaymentMint &&
            paymentMints
          ) {
            price = getMintDecimalAmount(
              paymentMints[
                tokenData.timeInvalidator?.parsed?.extensionPaymentMint.toString()
              ]!,
              tokenData.timeInvalidator?.parsed?.extensionPaymentAmount
            ).toNumber()
            duration =
              tokenData.timeInvalidator.parsed.extensionDurationSeconds.toNumber()
          }
        } else {
          if (
            tokenData.claimApprover?.parsed?.paymentMint &&
            paymentMints &&
            paymentMints &&
            paymentMints[
              tokenData.claimApprover?.parsed?.paymentMint.toString()
            ]
          ) {
            price = getPriceFromTokenData(tokenData, paymentMints)
          }
          if (tokenData.timeInvalidator.parsed.durationSeconds) {
            duration =
              tokenData.timeInvalidator.parsed.durationSeconds.toNumber()
          } else if (tokenData.timeInvalidator.parsed.maxExpiration) {
            duration =
              tokenData.timeInvalidator.parsed.maxExpiration.toNumber() -
              Date.now() / 1000
          }
        }
      }
      return (
        (price / duration) * DURATION_DATA[config.marketplaceRate ?? 'days']
      )
    })
  if (rentalPrices.length === 0) return 0
  return Math.min(...rentalPrices)
}

export const HeroStats: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { config } = useProjectConfig()
  const projectStats = useProjectStats()
  const paymentMints = usePaymentMints()
  const availableTokens = useBrowseAvailableTokenDatas(false, true)
  return (
    <div className={`flex flex-wrap gap-y-5 ${className}`}>
      <div className="flex flex-col items-center justify-center">
        <div className="text-lg text-medium-4">Floor price</div>
        {!availableTokens.data || !paymentMints.data ? (
          <div className="h-6 w-10 animate-pulse rounded-md bg-border"></div>
        ) : (
          <div className="text-center text-xl text-light-1">
            {Number(
              calculateFloorPrice(
                availableTokens.data,
                config,
                paymentMints.data
              ).toFixed(6)
            )}{' '}
            {getSymbolFromTokenData(availableTokens.data[0] ?? {})}
            {' / '}
            {config.marketplaceRate
              ? config.marketplaceRate
                  .substring(0, config.marketplaceRate.length - 1)
                  .toUpperCase()
              : 'day'}
          </div>
        )}
      </div>
      <div className="mx-4 my-auto h-10 w-[1px] bg-border lg:mx-16"></div>
      <div className="flex-col">
        <p className="text-lg text-medium-4">Listed</p>
        {!availableTokens.data ? (
          <div className="h-6 w-10 animate-pulse rounded-md bg-border"></div>
        ) : (
          <div className="text-center text-xl text-light-1">
            {availableTokens.data.length}
          </div>
        )}
      </div>

      {projectStats && (
        <>
          {projectStats.data?.totalRentalCount && (
            <>
              <div className="mx-4 my-auto h-10 w-[1px] bg-border lg:mx-16"></div>
              <div className="flex-col">
                <p className="text-lg text-medium-4">Total rentals</p>
                {!projectStats.data ? (
                  <div className="h-6 w-10 animate-pulse rounded-md bg-border"></div>
                ) : (
                  <div className="text-center text-xl text-light-1">
                    {projectStats.data?.totalRentalCount}
                  </div>
                )}
              </div>
            </>
          )}
          {projectStats.data?.totalRentalDuration && (
            <>
              <div className="my-3 w-[1px]"></div>
              <div className="flex-col">
                <p className="text-lg text-medium-4">
                  TOTAL DURATION (ALL-TIME)
                </p>
                <div className="text-center text-xl text-light-1">
                  {secondsToString(projectStats.data?.totalRentalDuration)}
                </div>
              </div>
            </>
          )}
          {projectStats.data?.totalRentalVolume && (
            <>
              <div className="my-3 w-[1px]"></div>
              <div className="flex-col">
                <p className="text-lg text-medium-4">TOTAL VOLUME (ALL-TIME)</p>
                <div className="text-center text-xl text-light-1">
                  {secondsToString(projectStats.data?.totalRentalVolume)} ◎
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
