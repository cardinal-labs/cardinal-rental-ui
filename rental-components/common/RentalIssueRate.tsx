import { capitalizeFirstLetter, secondstoDuration } from '@cardinal/common'
import { css } from '@emotion/react'
import type * as anchor from '@project-serum/anchor'
import { DatePicker } from 'antd'
import type { TokenData } from 'apis/api'
import { Alert } from 'common/Alert'
import { Button } from 'common/Button'
import type { DurationOption } from 'common/DurationInput'
import { DURATION_DATA, SECONDS_TO_DURATION } from 'common/DurationInput'
import { handleCopy } from 'common/NFTHeader'
import { Selector } from 'common/Selector'
import { fmtMintAmount } from 'common/units'
import type { IssueTxResult } from 'handlers/useHandleIssueRental'
import { useHandleIssueRental } from 'handlers/useHandleIssueRental'
import { PAYMENT_MINTS, usePaymentMints } from 'hooks/usePaymentMints'
import moment from 'moment'
import { useState } from 'react'
import { FaLink } from 'react-icons/fa'
import { FiSend } from 'react-icons/fi'
import { MintPriceSelector } from 'rental-components/common/MintPriceSelector'
import type { RentalCardConfig } from 'rental-components/components/RentalIssueCard'

import { SolanaLogo } from './icons'
import type { RentalIssueAdvancedValues } from './RentalIssueAdvanced'
import { RentalIssueAdvanced } from './RentalIssueAdvanced'
import { RentalIssueResults } from './RentalIssueResults'
import { RentalIssueTerms } from './RentalIssueTerms'

export type RentalIssueRateProps = {
  tokenDatas: TokenData[]
  rentalCardConfig: RentalCardConfig
  showAdvanced: boolean
  txResults?: IssueTxResult[]
  setTxResults: (r: IssueTxResult[]) => void
}

export const RentalIssueRate = ({
  tokenDatas,
  rentalCardConfig,
  showAdvanced,
  txResults,
  setTxResults,
}: RentalIssueRateProps) => {
  const [error, setError] = useState<string>()
  const paymentMintInfos = usePaymentMints()
  const handleIssueRental = useHandleIssueRental()

  // Pull overrides from config
  const durationData = rentalCardConfig.invalidationOptions?.durationOptions
    ? Object.keys(DURATION_DATA)
        .filter((key) =>
          rentalCardConfig.invalidationOptions?.durationOptions?.includes(
            key as DurationOption
          )
        )
        .reduce((obj: { [key: string]: number }, key: string) => {
          const d = DURATION_DATA[key as DurationOption]
          if (d) {
            obj[key] = d
          }
          return obj
        }, {})
    : DURATION_DATA

  const paymentMintData = rentalCardConfig.invalidationOptions?.paymentMints
    ? PAYMENT_MINTS.filter(({ mint }) =>
        rentalCardConfig.invalidationOptions?.paymentMints?.includes(mint)
      )
    : PAYMENT_MINTS

  // state
  const [extensionPaymentAmount, setExtensionPaymentAmount] =
    useState<anchor.BN>()
  const [extensionPaymentMint, setExtensionPaymentMint] = useState(
    paymentMintData[0]!.mint
  )
  const [extensionDurationSeconds, setExtensionDurationSeconds] =
    useState<number>(
      DURATION_DATA[
        rentalCardConfig.invalidationOptions?.freezeRentalDuration
          ?.durationOption || 'days'
      ]
    )
  const [maxExpiration, setMaxExpiration] = useState<number | undefined>(
    rentalCardConfig.invalidationOptions?.maxDurationAllowed?.value
      ? Date.now() / 1000 +
          rentalCardConfig.invalidationOptions?.maxDurationAllowed?.value
      : undefined
  )
  const [advancedValues, setAdvancedValues] =
    useState<RentalIssueAdvancedValues>()
  const [confirmRentalTerms, setConfirmRentalTerms] = useState(false)

  const extensionRate = () => {
    const denominator = extensionDurationSeconds
      ? SECONDS_TO_DURATION[extensionDurationSeconds]
          ?.toLowerCase()
          .slice(0, -1) ?? secondstoDuration(extensionDurationSeconds)
      : '?'

    return `${
      paymentMintInfos.data && extensionPaymentAmount
        ? fmtMintAmount(
            paymentMintInfos.data[extensionPaymentMint.toString()],
            extensionPaymentAmount
          )
        : 0
    } ${
      paymentMintData.find((obj) => obj.mint === extensionPaymentMint)?.symbol
    } / ${denominator}`
  }

  const defaultDurationOption =
    rentalCardConfig.invalidationOptions?.freezeRentalDuration
      ?.durationOption || 'days'

  return (
    <div className="flex flex-col gap-4">
      <RentalIssueAdvanced
        rentalCardConfig={rentalCardConfig}
        showAdvanced={showAdvanced}
        onChange={(advancedValues) => {
          setAdvancedValues(advancedValues)
        }}
      />
      <div className="flex gap-4">
        <div className="w-3/4">
          <div className="mb-1 text-base text-light-0">Rental rate</div>
          <div className="flex gap-1">
            <MintPriceSelector
              defaultPrice={extensionPaymentAmount}
              defaultMint={extensionPaymentMint}
              paymentMintData={paymentMintData}
              mintDisabled={paymentMintData.length === 1}
              handleValue={(v) => {
                setExtensionPaymentAmount(v.price.value)
                setExtensionPaymentMint(v.mint.value)
              }}
            />
            <div>
              <Selector<DurationOption>
                className="w-max rounded-xl"
                onChange={(e) =>
                  e?.value &&
                  setExtensionDurationSeconds(DURATION_DATA[e.value])
                }
                defaultOption={{
                  value: defaultDurationOption,
                  label: capitalizeFirstLetter(defaultDurationOption).substring(
                    0,
                    defaultDurationOption.length - 1
                  ),
                }}
                disabled={
                  rentalCardConfig.invalidationOptions?.freezeRentalRateDuration
                    ? true
                    : false
                }
                options={Object.keys(durationData).map((option) => ({
                  label: capitalizeFirstLetter(option).substring(
                    0,
                    option.length - 1
                  ),
                  value: option as DurationOption,
                }))}
              />
            </div>
          </div>
        </div>
        <div>
          <div className="mb-1 text-base text-light-0">Max rental duration</div>
          <DatePicker
            className="rounded-xl bg-dark-4 py-2 px-3 text-base"
            css={css`
              input {
                line-height: 1.5rem !important;
              }
            `}
            value={maxExpiration ? moment(maxExpiration * 1000) : undefined}
            showTime
            onChange={(e) =>
              setMaxExpiration(e ? e.valueOf() / 1000 : undefined)
            }
          />
        </div>
      </div>
      {txResults ? (
        <RentalIssueResults txResults={txResults} tokenDatas={tokenDatas} />
      ) : error ? (
        <Alert variant="error" showClose onClick={() => setError(undefined)}>
          {error}
        </Alert>
      ) : (
        <div className="rounded-xl bg-dark-4">
          <div className="flex items-center p-4">
            <div className="flex gap-4">
              <div>
                <SolanaLogo width={24} height={24} />
              </div>
              <div>You set the rate at {extensionRate()}</div>
            </div>
          </div>
          <div className="flex gap-3 border-t-[1px] border-border py-4 px-8 text-sm text-medium-3">
            This token can be rented at the specified rate for any duration less
            than or equal to the max rental duration.{' '}
            {maxExpiration &&
              `It will be automatically returned to your wallet at ${new Date(maxExpiration * 1000)
                .toLocaleString('en-US')
                .substring(11, undefined)} on ${new Date(maxExpiration * 1000)
                .toLocaleString('en-US')
                .substring(0, 10)}.`}
          </div>
        </div>
      )}
      <RentalIssueTerms
        confirmed={confirmRentalTerms}
        onClick={() => {
          setConfirmRentalTerms(!confirmRentalTerms)
          setError(undefined)
        }}
      />
      <Button
        variant="primary"
        className="h-12"
        disabled={!confirmRentalTerms || !!error}
        loading={handleIssueRental.isLoading}
        onClick={async () => {
          txResults
            ? handleCopy(txResults[0]?.claimLink ?? '')
            : handleIssueRental.mutate(
                {
                  tokenDatas: tokenDatas,
                  rentalCardConfig,
                  paymentAmount: undefined,
                  paymentMint: undefined,
                  durationSeconds: 0,
                  maxExpiration: maxExpiration,
                  extensionPaymentMint,
                  extensionPaymentAmount,
                  extensionDurationSeconds,
                  totalUsages: undefined,
                  invalidationType: advancedValues?.invalidationType,
                  visibility: advancedValues?.visibility,
                  customInvalidator: undefined,
                  disablePartialExtension: undefined,
                  claimRentalReceipt: undefined,
                },
                {
                  onSuccess: (txData) => {
                    setTxResults(txData)
                  },
                  onError: (e) => {
                    setError(`${e}`)
                    setConfirmRentalTerms(false)
                  },
                }
              )
        }}
      >
        {txResults?.length === 0 ? (
          <div className="flex items-center justify-center gap-[5px] text-base">
            <FaLink />
            Copy link
          </div>
        ) : (
          <div className="flex items-center justify-center gap-[5px] text-base">
            {advancedValues?.visibility === 'private'
              ? 'Get private link'
              : 'List for rent'}
            <FiSend />
          </div>
        )}
      </Button>
    </div>
  )
}
