import { secondsToString } from '@cardinal/common'
import { shouldTimeInvalidate } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator/utils'
import { BN } from '@project-serum/anchor'
import type * as splToken from '@solana/spl-token'
import type { TokenData } from 'apis/api'
import { DURATION_DATA } from 'common/DurationInput'
import { mintImage, mintSymbol } from 'common/NFTClaimButton'
import { fmtMintAmount, getMintDecimalAmount } from 'common/units'
import type { ProjectConfig } from 'config/config'
import { SolanaLogo } from 'rental-components/common/icons'
import type { InvalidatorOption } from 'rental-components/components/RentalIssueCard'

export const getTokenMaxDuration = (
  tokenData: Pick<TokenData, 'timeInvalidator'>,
  UTCNow: number
) => {
  if (tokenData.timeInvalidator?.parsed.maxExpiration) {
    const maxDuration =
      tokenData.timeInvalidator?.parsed.maxExpiration?.toNumber() - UTCNow
    return {
      value: maxDuration,
      displayText: secondsToString(maxDuration, false),
    }
  } else {
    return { value: Infinity, displayText: '∞' }
  }
}

export const getSymbolFromTokenData = (
  tokenData: Pick<TokenData, 'claimApprover' | 'timeInvalidator'>
) => {
  return mintSymbol(
    tokenData.claimApprover?.parsed?.paymentMint ??
      tokenData.timeInvalidator?.parsed.extensionPaymentMint
  )
}

export const PaymentMintImage: React.FC<
  {
    width?: number
    height?: number
    tokenData: TokenData
  } & React.HTMLAttributes<HTMLDivElement>
> = ({ tokenData, ...props }: { tokenData: TokenData }) => {
  const img = mintImage(
    tokenData.claimApprover?.parsed?.paymentMint ??
      tokenData.timeInvalidator?.parsed.extensionPaymentMint
  )
  return img ? (
    <img {...props} src={img} alt={tokenData.metaplexData?.parsed.data.name} />
  ) : (
    <SolanaLogo {...props} />
  )
}

export function getTokenRentalRate(
  config: ProjectConfig,
  paymentMints: { [name: string]: splToken.MintInfo },
  tokenData: Pick<TokenData, 'timeInvalidator' | 'claimApprover'>
) {
  const rateOption = config.marketplaceRate ?? 'days'
  const rateSeconds = new BN(DURATION_DATA[rateOption])
  const {
    extensionPaymentAmount,
    extensionPaymentMint,
    extensionDurationSeconds,
  } = tokenData.timeInvalidator?.parsed || {
    extensionPaymentAmount: null,
    extensionPaymentMint: null,
    extensionDurationOption: null,
  }

  if (
    !extensionPaymentAmount ||
    !extensionPaymentMint ||
    !extensionDurationSeconds
  ) {
    return null
  }

  const marketplaceRate =
    (extensionPaymentAmount.toNumber() / extensionDurationSeconds.toNumber()) *
    rateSeconds.toNumber()

  const tokenPrice = getPriceFromTokenData(tokenData, paymentMints)
  try {
    return {
      rate: paymentMints[extensionPaymentMint.toString()]
        ? tokenPrice +
          getMintDecimalAmount(
            paymentMints[extensionPaymentMint.toString()]!,
            new BN(marketplaceRate)
          ).toNumber()
        : 0,
      displayText: `${tokenPrice ? `${tokenPrice} + ` : ''}${fmtMintAmount(
        paymentMints[extensionPaymentMint.toString()],
        new BN(marketplaceRate)
      )}${getSymbolFromTokenData(tokenData)} / ${rateOption?.substring(
        0,
        rateOption.length - 1
      )}`,
    }
  } catch (e) {
    return null
  }
}

export const getPriceFromTokenData = (
  tokenData: Pick<TokenData, 'claimApprover'>,
  paymentMints?: { [name: string]: splToken.MintInfo }
): number => {
  if (
    tokenData.claimApprover?.parsed &&
    tokenData.claimApprover?.parsed?.paymentMint.toString() &&
    paymentMints
  ) {
    const mintInfo =
      paymentMints[tokenData.claimApprover?.parsed?.paymentMint.toString()]
    if (mintInfo) {
      return getMintDecimalAmount(
        mintInfo,
        tokenData.claimApprover?.parsed?.paymentAmount
      ).toNumber()
    } else {
      return 0
    }
  } else {
    return 0
  }
}

export const getPriceOrRentalRate = (
  config: ProjectConfig,
  tokenData: Pick<TokenData, 'timeInvalidator' | 'claimApprover'>,
  paymentMints?: { [name: string]: splToken.MintInfo }
) => {
  if (!paymentMints) return 0

  const rate = DURATION_DATA[config.marketplaceRate ?? 'days']
  if (tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber() === 0) {
    return getTokenRentalRate(config, paymentMints, tokenData)?.rate ?? 0
  } else {
    const price = getPriceFromTokenData(tokenData, paymentMints)
    if (price === 0) return 0

    let duration = Infinity
    if (tokenData.timeInvalidator?.parsed.durationSeconds) {
      duration = tokenData.timeInvalidator.parsed.durationSeconds.toNumber()
    } else if (tokenData.timeInvalidator?.parsed.expiration) {
      duration =
        tokenData.timeInvalidator.parsed.expiration.toNumber() -
        Date.now() / 1000
    }
    if (tokenData.timeInvalidator?.parsed.maxExpiration) {
      duration = Math.min(
        duration,
        tokenData.timeInvalidator.parsed.maxExpiration.toNumber() -
          Date.now() / 1000
      )
    }
    return (price / duration) * rate
  }
}

export const getRentalDuration = (
  tokenData: Pick<TokenData, 'timeInvalidator'>,
  UTCNow: number,
  claimed?: boolean
) => {
  if (
    claimed &&
    tokenData.timeInvalidator?.parsed.expiration?.toNumber() &&
    tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber() === 0
  ) {
    return tokenData.timeInvalidator?.parsed.expiration?.toNumber() - UTCNow
  }
  if (tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber() === 0) {
    return getTokenMaxDuration(tokenData, UTCNow).value
  } else if (tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber()) {
    return tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber()
  } else if (tokenData.timeInvalidator?.parsed.expiration?.toNumber()) {
    return tokenData.timeInvalidator?.parsed.expiration?.toNumber() - UTCNow
  } else {
    return 0
  }
}

export const isPrivateListing = (
  tokenData: Pick<TokenData, 'claimApprover' | 'tokenManager'>
) =>
  tokenData.tokenManager?.parsed.claimApprover &&
  !tokenData.claimApprover?.parsed

export const isRateBasedListing = (
  tokenData: Pick<TokenData, 'timeInvalidator'>
) =>
  !!tokenData.timeInvalidator?.parsed.durationSeconds &&
  tokenData.timeInvalidator?.parsed.durationSeconds.eq(new BN(0)) &&
  !!tokenData.timeInvalidator?.parsed.extensionDurationSeconds

export const rentalType = (tokenData: TokenData) => {
  return !tokenData.timeInvalidator && !tokenData.useInvalidator
    ? 'manual'
    : isRateBasedListing(tokenData)
    ? 'rate'
    : tokenData.timeInvalidator?.parsed?.durationSeconds
    ? 'duration'
    : 'expiration'
}

export const rentalTypeColor = (type: InvalidatorOption) =>
  ({
    manual: 'text-primary-2',
    rate: 'text-primary',
    duration: 'text-secondary',
    expiration: 'text-blue',
  }[type])

export const rentalTypeName = (type: InvalidatorOption) =>
  ({
    manual: 'Manual',
    rate: 'Rate rental',
    duration: 'Fixed duration',
    expiration: 'Fixed expiration',
  }[type])

export const elligibleForRent = (
  config: ProjectConfig,
  tokenData: Pick<
    TokenData,
    'tokenAccount' | 'tokenManager' | 'editionData' | 'mint'
  >
): boolean => {
  return (
    !config.disableListing &&
    !tokenData.tokenManager &&
    tokenData.tokenAccount?.parsed.state !== 'frozen' &&
    !!tokenData.editionData &&
    (!tokenData.mint || !!tokenData.mint.parsed.freezeAuthority)
  )
}

export const elligibleForClaim = (
  tokenData: Pick<TokenData, 'tokenManager' | 'mint'>,
  editionId?: string
): boolean => {
  return (
    !!tokenData.tokenManager &&
    (!tokenData.mint || !!tokenData.mint.parsed.freezeAuthority) &&
    (!editionId ||
      editionId === tokenData.mint?.parsed.freezeAuthority?.toString())
  )
}

export const shouldBeInvalidated = (
  tokenData: TokenData,
  UTCNow: number
): boolean => {
  return (
    (!!tokenData.timeInvalidator &&
      !!tokenData.tokenManager &&
      shouldTimeInvalidate(
        tokenData.tokenManager,
        tokenData.timeInvalidator,
        UTCNow
      )) ||
    (!!tokenData.useInvalidator &&
      !!tokenData.useInvalidator.parsed.maxUsages &&
      tokenData.useInvalidator.parsed.usages.gte(
        tokenData.useInvalidator.parsed.maxUsages
      ))
  )
}
