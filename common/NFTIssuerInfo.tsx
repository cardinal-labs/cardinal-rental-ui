import {
  getExpirationString,
  secondsToString,
  tryPublicKey,
} from '@cardinal/common'
import { DisplayAddress } from '@cardinal/namespaces-components'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type * as splToken from '@solana/spl-token'
import type { TokenData } from 'apis/api'
import {
  getPriceFromTokenData,
  getPriceOrRentalRate,
  getSymbolFromTokenData,
  getTokenMaxDuration,
  getTokenRentalRate,
  isPrivateListing,
  isRateBasedListing,
  rentalType,
  rentalTypeColor,
} from 'common/tokenDataUtils'
import type { ProjectConfig } from 'config/config'
import { usePaymentMints } from 'hooks/usePaymentMints'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUTCNow } from 'providers/UTCNowProvider'

export const getDurationText = (tokenData: TokenData, UTCNow: number) => {
  return tokenData.timeInvalidator?.parsed ? (
    <div className="float-left">
      {isRateBasedListing(tokenData) ? (
        <p
          className={`float-left inline-block text-ellipsis whitespace-nowrap`}
        >
          Max: <b>{getTokenMaxDuration(tokenData, UTCNow).displayText}</b>
        </p>
      ) : tokenData.timeInvalidator?.parsed.durationSeconds ? (
        <p className="float-left inline-block text-ellipsis whitespace-nowrap">
          Fixed duration:{' '}
          <b>
            {tokenData.timeInvalidator?.parsed.durationSeconds.toNumber()
              ? secondsToString(
                  tokenData.timeInvalidator?.parsed.durationSeconds.toNumber(),
                  false
                )
              : '0'}
          </b>
        </p>
      ) : tokenData.timeInvalidator?.parsed.expiration ? (
        <p className="float-left inline-block text-ellipsis whitespace-nowrap">
          Expires:{' '}
          <b>
            {getExpirationString(
              tokenData.timeInvalidator?.parsed.expiration?.toNumber(),
              UTCNow
            )}
          </b>
        </p>
      ) : tokenData.timeInvalidator?.parsed.maxExpiration ? (
        <p className="float-left inline-block text-ellipsis whitespace-nowrap">
          Expires:{' '}
          <b>
            {getExpirationString(
              tokenData.timeInvalidator?.parsed.maxExpiration?.toNumber(),
              UTCNow
            )}
          </b>
        </p>
      ) : null}
    </div>
  ) : null
}

export const getRentalRateDisplayText = (
  config: ProjectConfig,
  tokenData: TokenData,
  paymentMints?: { [name: string]: splToken.MintInfo },
  accentColor = 'text-light-2'
) => {
  return isRateBasedListing(tokenData) ? (
    <>
      {getTokenRentalRate(config, paymentMints ?? {}, tokenData)?.displayText}
    </>
  ) : (
    <>
      {getPriceFromTokenData(tokenData, paymentMints)}
      {getSymbolFromTokenData(tokenData)}
      <span className={accentColor}>
        {' '}
        ={' '}
        {Number(
          getPriceOrRentalRate(config, tokenData, paymentMints).toFixed(4)
        )}
        {getSymbolFromTokenData(tokenData)} /{' '}
        {(config.marketplaceRate ?? 'days').slice(0, -1)}
      </span>
    </>
  )
}

interface NFTIssuerInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: TokenData
}

export const NFTIssuerInfo: React.FC<NFTIssuerInfoProps> = ({
  tokenData,
}: NFTIssuerInfoProps) => {
  const { UTCNow } = useUTCNow()
  const { secondaryConnection } = useEnvironmentCtx()
  const { config } = useProjectConfig()
  const paymentMints = usePaymentMints()
  return (
    <div>
      {tokenData.tokenManager?.parsed.state === TokenManagerState.Issued ? (
        isPrivateListing(tokenData) ? (
          <div className="my-auto rounded-lg bg-gray-800 px-5 py-2 text-white">
            Private
          </div>
        ) : (
          <div className="flex flex-col text-light-2">
            <div className={`${rentalTypeColor(rentalType(tokenData))}`}>
              {getDurationText(tokenData, UTCNow)}
            </div>
            <div className="text-light-0">
              {getRentalRateDisplayText(config, tokenData, paymentMints.data)}{' '}
            </div>
          </div>
        )
      ) : (
        tokenData.recipientTokenAccount?.parsed.owner && (
          <div className="flex flex-col text-secondary">
            <div className="flex">
              <div>Claimed by&nbsp;</div>
              <DisplayAddress
                connection={secondaryConnection}
                address={
                  tryPublicKey(tokenData.recipientTokenAccount?.parsed.owner) ??
                  undefined
                }
                height="18px"
                width="100px"
                dark={true}
              />
            </div>
          </div>
        )
      )}
    </div>
  )
}
