import type { TokenData } from 'apis/api'
import { Alert } from 'common/Alert'
import { handleCopy } from 'common/NFTHeader'
import type { IssueTxResult } from 'handlers/useHandleIssueRental'

export const RentalIssueResults = ({
  txResults,
  tokenDatas,
}: {
  txResults: IssueTxResult[]
  tokenDatas: TokenData[]
}) => {
  const [successfulListings, errorListings] = txResults.reduce(
    (acc, txResult) =>
      txResult.txid
        ? [[...acc[0], txResult], acc[1]]
        : [acc[0], [...acc[1], txResult]],
    [[], []] as [IssueTxResult[], IssueTxResult[]]
  )
  return (
    <div className="flex flex-col gap-2">
      {txResults.some((v) => v.error) && (
        <div className="mb-2 text-medium-3">
          Private links generated below include claim password in the link.
          These can only be used once and cannot be regenerated.
        </div>
      )}
      {successfulListings.length > 0 && (
        <Alert variant="success" className="text-left">
          Successfully listed: ({txResults.filter(({ txid }) => txid)} /{' '}
          {tokenDatas.length}){' '}
        </Alert>
      )}
      {successfulListings.map(
        (txResult, i) =>
          txResult.otpKeypair && (
            <Alert
              variant="success"
              className="cursor-pointer"
              onClick={() => handleCopy(txResult.claimLink)}
            >
              <div className="">
                Success ({i + 1}/{txResults.length}): Private link generated.
                Click
                <div className="text-blue-500 mx-1 inline-block">here</div>to
                copy
              </div>
            </Alert>
          )
      )}
      {errorListings.map(({ error }, i) => (
        <Alert variant="error" key={error}>
          Error ({i + 1}/{txResults.length}): {error}
        </Alert>
      ))}
    </div>
  )
}
