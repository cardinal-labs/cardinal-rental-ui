import { ProfileSmall } from '@cardinal/namespaces-components'
import type { Keypair } from '@solana/web3.js'
import type { TokenData } from 'apis/api'
import { Alert } from 'common/Alert'
import { Button } from 'common/Button'
import { useHandleClaimRental } from 'handlers/useHandleClaimRental'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useModal } from 'providers/ModalProvider'
import { useState } from 'react'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'
import { RentalClaimCardTokenHeader } from 'rental-components/common/RentalCardTokenHeader'

import { RentalSuccessCard } from './RentalSuccessCard'

export type RentalManualCardParams = {
  tokenData: TokenData
  otpKeypair?: Keypair
}

export const RentalManualCard = ({
  tokenData,
  otpKeypair,
}: RentalManualCardParams) => {
  const [error, setError] = useState<string>()
  const [txid, setTxid] = useState<string>()
  const handleClaimRental = useHandleClaimRental()
  const { connection } = useEnvironmentCtx()

  if (txid) return <RentalSuccessCard tokenData={tokenData} txid={txid} />
  return (
    <div className="rounded-lg bg-dark-6 p-8">
      <RentalClaimCardTokenHeader tokenData={tokenData} />
      <div className="mb-8 px-8 text-center text-base text-medium-3">
        You may own this NFT asset until a designated owner revokes the rental.
      </div>
      <div className="flex flex-col gap-4">
        <div className="text-base">Manual revocation can be triggered by</div>
        {tokenData.tokenManager?.parsed.invalidators.map((i) => (
          <div key={i.toString()} className="rounded-xl bg-dark-4 px-4 py-2">
            <ProfileSmall connection={connection} address={i} />
          </div>
        ))}
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
export const useRentalManualCard = () => {
  const { showModal } = useModal()
  return {
    showModal: (params: RentalManualCardParams) =>
      showModal(<RentalManualCard {...params} />),
  }
}
