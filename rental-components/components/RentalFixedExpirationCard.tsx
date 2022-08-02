import { capitalizeFirstLetter } from '@cardinal/common'
import type { Keypair } from '@solana/web3.js'
import type { TokenData } from 'apis/api'
import { Alert } from 'common/Alert'
import { Button } from 'common/Button'
import { RentalSummary } from 'common/RentalSummary'
import {
  getPriceFromTokenData,
  getPriceOrRentalRate,
  getSymbolFromTokenData,
} from 'common/tokenDataUtils'
import { useHandleClaimRental } from 'handlers/useHandleClaimRental'
import { usePaymentMints } from 'hooks/usePaymentMints'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useModal } from 'providers/ModalProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useState } from 'react'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'
import { RentalClaimCardTokenHeader } from 'rental-components/common/RentalCardTokenHeader'

import { RentalSuccessCard } from './RentalSuccessCard'

export type RentalFixedExpirationParams = {
  tokenData: TokenData
  otpKeypair?: Keypair
}

export const RentalFixedExpirationCard = ({
  tokenData,
  otpKeypair,
}: RentalFixedExpirationParams) => {
  const [error, setError] = useState<string>()
  const [txid, setTxid] = useState<string>()
  const handleClaimRental = useHandleClaimRental()
  const paymentMints = usePaymentMints()
  const { environment } = useEnvironmentCtx()
  const { configFromToken } = useProjectConfig()
  const config = configFromToken(tokenData)
  const { maxExpiration } = tokenData.timeInvalidator?.parsed || {}

  if (txid) return <RentalSuccessCard tokenData={tokenData} txid={txid} />
  return (
    <div className="rounded-lg bg-dark-6 p-8">
      <RentalClaimCardTokenHeader tokenData={tokenData} />
      {maxExpiration && (
        <div className="mb-8 px-8 text-center text-base text-medium-3">
          This NFT can be rented and you will hold it until{' '}
          {new Date(maxExpiration.toNumber() * 1000).toLocaleString('en-US')}
        </div>
      )}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-4">
          <div>
            <div className="mb-1 text-base text-light-0">Rental expiration</div>
            <div className="text-base text-medium-3">
              {maxExpiration &&
                new Date(maxExpiration.toNumber() * 1000).toLocaleString(
                  'en-US'
                )}
            </div>
          </div>
          <div>
            <div className="mb-1 text-base text-light-0">Fixed price</div>
            <div className="text-base text-medium-3">
              {getPriceFromTokenData(tokenData, paymentMints.data)}
              {getSymbolFromTokenData(tokenData)} ={' '}
              {getPriceOrRentalRate(
                config,
                tokenData,
                paymentMints.data
              ).toFixed(4)}
              {getSymbolFromTokenData(tokenData)} /{' '}
              {capitalizeFirstLetter(config.marketplaceRate ?? 'days').slice(
                0,
                -1
              )}
            </div>
          </div>
        </div>
        <RentalSummary tokenData={tokenData} />
        {txid && (
          <Alert variant="success">
            Congratulations! You have succesfully claimed your rental with
            transaction shown{' '}
            <a
              className="text-blue-500"
              href={`https://explorer.solana.com/tx/${txid}?cluster=${
                environment.label?.toString() ?? ''
              }`}
              target="_blank"
              rel="noopener noreferrer"
            >
              here
            </a>
          </Alert>
        )}
        {error && (
          <Alert variant="error" showClose onClick={() => setError(undefined)}>
            {error}
          </Alert>
        )}
        <Button
          variant="primary"
          className="h-12"
          onClick={() =>
            handleClaimRental.mutate(
              {
                tokenData,
                otpKeypair,
              },
              {
                onSuccess: (txid) => {
                  setTxid(txid)
                },
                onError: (e) => {
                  setTxid(undefined)
                  setError(`${e}`)
                },
              }
            )
          }
        >
          {handleClaimRental.isLoading ? (
            <LoadingSpinner height="25px" />
          ) : (
            <div
              style={{ gap: '5px' }}
              className="flex items-center justify-center text-base"
            >
              Rent NFT
            </div>
          )}
        </Button>
      </div>
      <PoweredByFooter />
    </div>
  )
}
export const useRentalFixedExpirationCard = () => {
  const { showModal } = useModal()
  return {
    showModal: (params: RentalFixedExpirationParams) =>
      showModal(<RentalFixedExpirationCard {...params} />),
  }
}
