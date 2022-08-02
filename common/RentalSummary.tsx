import { capitalizeFirstLetter, shortDateString } from '@cardinal/common'
import { BN } from '@project-serum/anchor'
import type * as splToken from '@solana/spl-token'
import type { TokenData } from 'apis/api'
import {
  getPriceFromTokenData,
  getSymbolFromTokenData,
  PaymentMintImage,
} from 'common/tokenDataUtils'
import { usePaymentMints } from 'hooks/usePaymentMints'
import { useUTCNow } from 'providers/UTCNowProvider'

import { getMintDecimalAmount } from './units'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: TokenData
  extensionSeconds?: number
}

export const getExtensionPrice = (
  tokenData: TokenData,
  extensionSeconds: number,
  paymentMints?: { [name: string]: splToken.MintInfo }
): number => {
  if (
    !paymentMints ||
    !tokenData.timeInvalidator?.parsed.extensionPaymentMint ||
    !tokenData.timeInvalidator?.parsed.extensionPaymentAmount ||
    !tokenData.timeInvalidator?.parsed.extensionDurationSeconds
  ) {
    return 0
  }

  const mintInfo =
    paymentMints[
      tokenData.timeInvalidator?.parsed?.extensionPaymentMint.toString()
    ]
  if (!mintInfo) return 0
  return getMintDecimalAmount(
    mintInfo,
    (tokenData.timeInvalidator?.parsed.extensionPaymentAmount ?? new BN(0))
      .mul(new BN(extensionSeconds))
      .div(
        tokenData.timeInvalidator?.parsed.extensionDurationSeconds ?? new BN(1)
      )
  ).toNumber()
}

export const secondsToStringForDisplay = (
  secondsAmount: number | undefined | null,
  config?: {
    defaultString?: string
    delimiter?: string
    groupDelimiter?: string
    capitalizeSuffix?: boolean
    showTrailingZeros?: boolean
    showLeadingZeros?: boolean
    fullSuffix?: boolean
    includes?: {
      suffix: string
      fullSuffix: string
      durationSeconds: number
      mod: number
    }[]
  }
) => {
  const ranges = config?.includes ?? [
    {
      suffix: 'd',
      fullSuffix: 'days',
      durationSeconds: 60 * 60 * 24,
    },
    {
      suffix: 'h',
      fullSuffix: 'hours',
      durationSeconds: 60 * 60,
      mod: 24,
    },
    {
      suffix: 'm',
      fullSuffix: 'minutes',
      durationSeconds: 60,
      mod: 60,
    },
    {
      suffix: 's',
      fullSuffix: 'seconds',
      durationSeconds: 1,
      mod: 60,
    },
  ]

  const getSuffix = (suffix: string, fullSuffix: string, amount: number) => {
    const preferredFullSuffix =
      amount === 1 ? fullSuffix.slice(0, -1) : fullSuffix
    const preferredSuffix = config?.fullSuffix ? preferredFullSuffix : suffix
    return `${
      config?.capitalizeSuffix
        ? capitalizeFirstLetter(preferredSuffix)
        : preferredSuffix
    }`
  }

  if (!secondsAmount || secondsAmount <= 0) {
    return (
      config?.defaultString ??
      (ranges[0]
        ? `0 ${getSuffix(ranges[0].suffix, ranges[0]?.fullSuffix, 0)}`
        : '0 days')
    )
  }

  const rangeAmount = (s: number, mod?: number) =>
    Math.floor(mod ? (secondsAmount / s) % mod : secondsAmount / s)

  const rangeAmounts = ranges.map(({ durationSeconds, mod }) =>
    rangeAmount(durationSeconds, mod)
  )

  const showRange = rangeAmounts.map(
    (rangeAmount, i) =>
      rangeAmount > 0 ||
      (config?.showTrailingZeros &&
        rangeAmounts.slice(i).reduce((t, v) => t + v, 0) > 0) ||
      (config?.showLeadingZeros &&
        rangeAmounts.slice(0, i - 1).reduce((t, v) => t + v, 0) > 0)
  )

  return ranges.map(({ durationSeconds, fullSuffix, suffix, mod }, i) => {
    if (!showRange[i]) return ''
    return `${rangeAmount(durationSeconds, mod)}${
      config?.delimiter ?? ''
    }${getSuffix(suffix, fullSuffix, rangeAmount(durationSeconds, mod))}${
      config?.groupDelimiter ?? ' '
    }`
  })
}

export const rentalExpirationWithExtension = (
  tokenData: TokenData,
  extensionSeconds: number | undefined,
  UTCNow: number
) => {
  const { durationSeconds, expiration, maxExpiration } =
    tokenData.timeInvalidator?.parsed || {}
  return shortDateString(
    extensionSeconds
      ? Math.max(
          UTCNow + (durationSeconds?.toNumber() ?? 0),
          expiration?.toNumber() ?? 0
        ) + extensionSeconds
      : Math.min(
          maxExpiration?.toNumber() ?? Infinity,
          expiration?.toNumber() ?? UTCNow + (durationSeconds?.toNumber() ?? 0)
        )
  )
}

export const RentalSummary: React.FC<Props> = ({
  tokenData,
  extensionSeconds,
}: Props) => {
  const { UTCNow } = useUTCNow()
  const paymentMints = usePaymentMints()
  return (
    <div className="flex justify-between gap-4 border-t-[1px] border-border pt-4">
      <div className="flex gap-4">
        <div>
          <PaymentMintImage
            width={24}
            height={24}
            className="mt-2"
            tokenData={tokenData}
          />
        </div>
        <div className="mb-2">
          <div className="text-lg font-medium">
            {extensionSeconds
              ? getPriceFromTokenData(tokenData, paymentMints.data) +
                getExtensionPrice(
                  tokenData,
                  extensionSeconds,
                  paymentMints.data
                )
              : getPriceFromTokenData(tokenData, paymentMints.data)}{' '}
            {getSymbolFromTokenData(tokenData)} for{' '}
            {secondsToStringForDisplay(
              extensionSeconds ??
                tokenData.timeInvalidator?.parsed?.durationSeconds?.toNumber() ??
                0,
              {
                fullSuffix: true,
                delimiter: ' ',
                showTrailingZeros: false,
              }
            )}
          </div>
          <div className="text-sm text-medium-3">
            Expires at{' '}
            {rentalExpirationWithExtension(tokenData, extensionSeconds, UTCNow)}
          </div>
        </div>
      </div>
    </div>
  )
}
