import { secondsToString, tryPublicKey } from '@cardinal/common'
import { BN } from '@project-serum/anchor'
import type { TokenData } from 'apis/api'
import { Alert } from 'common/Alert'
import { Button } from 'common/Button'
import { DurationInput } from 'common/DurationInput'
import { priceAndSymbol } from 'common/NFTClaimButton'
import { handleCopy } from 'common/NFTHeader'
import type { IssueTxResult } from 'handlers/useHandleIssueRental'
import { useHandleIssueRental } from 'handlers/useHandleIssueRental'
import { PAYMENT_MINTS, usePaymentMints } from 'hooks/usePaymentMints'
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

export type RentalIssueDurationParams = {
  tokenDatas: TokenData[]
  rentalCardConfig: RentalCardConfig
  showAdvanced: boolean
  txResults?: IssueTxResult[]
  setTxResults: (r: IssueTxResult[]) => void
}

export const RentalIssueDuration = ({
  tokenDatas,
  rentalCardConfig,
  showAdvanced,
  txResults,
  setTxResults,
}: RentalIssueDurationParams) => {
  const [error, setError] = useState<string>()
  const handleIssueRental = useHandleIssueRental()

  const paymentMints = usePaymentMints()
  const paymentMintData = rentalCardConfig.invalidationOptions?.paymentMints
    ? PAYMENT_MINTS.filter(({ mint }) =>
        rentalCardConfig.invalidationOptions?.paymentMints?.includes(mint)
      )
    : PAYMENT_MINTS
  const [paymentAmount, setPaymentAmount] = useState(new BN(0))
  const [paymentMint, setPaymentMint] = useState<string>(
    paymentMintData[0]!.mint
  )
  const [durationSeconds, setDurationSeconds] = useState<number>()

  const [advancedValues, setAdvancedValues] =
    useState<RentalIssueAdvancedValues>()
  const [confirmRentalTerms, setConfirmRentalTerms] = useState(false)

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
          <div className="mb-1 text-base text-light-0">Rental price</div>
          <MintPriceSelector
            defaultPrice={paymentAmount}
            defaultMint={paymentMint}
            mintDisabled={paymentMintData.length === 1}
            paymentMintData={paymentMintData}
            handleValue={(v) => {
              setPaymentAmount(v.price.value)
              setPaymentMint(v.mint.value)
            }}
          />
        </div>
        <div className="">
          <div className="mb-1 text-base text-light-0">Duration</div>
          <DurationInput
            handleChange={(v) => setDurationSeconds(v)}
            defaultAmount={
              rentalCardConfig.invalidationOptions?.freezeRentalDuration?.value
                ? parseInt(
                    rentalCardConfig.invalidationOptions?.freezeRentalDuration
                      ?.value
                  )
                : undefined
            }
            defaultOption={
              rentalCardConfig.invalidationOptions?.freezeRentalDuration
                ?.durationOption
            }
            disabled={
              !!rentalCardConfig.invalidationOptions?.freezeRentalDuration
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
              <div>
                You set the price at{' '}
                {priceAndSymbol(
                  paymentAmount,
                  tryPublicKey(paymentMint),
                  paymentMints.data
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 border-t-[1px] border-border py-4 px-8 text-center text-sm text-medium-3">
            {`This rental will be expire ${secondsToString(
              durationSeconds,
              false
            )} after the offer is accepted.`}
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
                  paymentAmount,
                  paymentMint,
                  durationSeconds,
                  extensionPaymentMint: undefined,
                  extensionPaymentAmount: undefined,
                  extensionDurationSeconds: undefined,
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
