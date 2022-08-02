import type { TokenData } from 'apis/api'
import { GlyphCheck } from 'assets/GlyphCheck'
import { Alert } from 'common/Alert'
import { Glow } from 'common/Glow'
import { handleCopy } from 'common/NFTHeader'
import { Pill } from 'common/Pill'
import {
  ShareTwitterButton,
  shareTwitterListedLink,
} from 'common/ShareTwitterButton'
import { transactionUrl } from 'common/utils'
import type { IssueTxResult } from 'handlers/useHandleIssueRental'
import { useMintMetadatas } from 'hooks/useMintMetadata'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { FaTwitter } from 'react-icons/fa'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'

export type RentalIssueSuccessCard = {
  tokenDatas: TokenData[]
  txResults: IssueTxResult[]
}

export const RentalIssueSuccessCard = ({
  tokenDatas,
  txResults,
}: RentalIssueSuccessCard) => {
  const { environment } = useEnvironmentCtx()
  const { configFromToken } = useProjectConfig()
  const config = configFromToken(tokenDatas[0])
  const mintMetadatas = useMintMetadatas(
    txResults.map(({ tokenData }) => tokenData)
  )

  return (
    <div className="relative rounded-lg bg-dark-6 p-8">
      <div className="absolute right-12 top-6 text-5xl">🎉</div>
      <div className="absolute left-8 top-[40%] z-10 text-5xl">🎉</div>
      <div className="absolute right-4 top-[60%] z-10 text-6xl">🎉</div>
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
        <Glow
          color="secondary"
          blur={5}
          scale={15}
          opacity={1}
          className="rounded-full"
        >
          <GlyphCheck />
        </Glow>
      </div>
      <div className="text-center text-2xl text-light-0">Congratulations!</div>
      <div className="mb-6 text-center text-lg text-medium-4">
        You&apos;ve listed{' '}
        {tokenDatas.length > 1
          ? `(${tokenDatas.length})`
          : tokenDatas[0]
          ? tokenDatas[0].metaplexData?.parsed.data.name
          : ''}
      </div>
      <div
        className={
          `flex w-full gap-4 overflow-x-auto pb-12 ` +
          (tokenDatas.length <= 2 ? 'justify-center' : '')
        }
      >
        {txResults.map(({ txid }, i) => (
          <div
            key={i}
            className="relative w-1/2 flex-shrink-0 rounded-lg bg-medium-4"
          >
            {mintMetadatas[i]?.data && (
              <img
                className="rounded-lg"
                src={mintMetadatas[i]?.data!.parsed?.image}
                alt={mintMetadatas[i]?.data!.parsed?.name}
              />
            )}
            {txid && (
              <a
                href={transactionUrl(txid, environment.label)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Pill
                  className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 border-[1px] border-border"
                  onClick={() => {}}
                >
                  View TX
                </Pill>
              </a>
            )}
          </div>
        ))}
      </div>
      {txResults.some((v) => v.otpKeypair) && (
        <div className="mb-2 text-medium-3">
          Private links generated below include claim password in the link.
          These can only be used once and cannot be regenerated.
        </div>
      )}
      {txResults.map(
        (txResult, i) =>
          txResult.otpKeypair && (
            <Alert
              variant="success"
              className="mb-4 cursor-pointer"
              onClick={() => handleCopy(txResult.claimLink)}
            >
              <div className="">
                ({i + 1}/{txResults.length}) Private link generated. Click
                <div className="text-blue-500 mx-1 inline-block">here</div>to
                copy
              </div>
            </Alert>
          )
      )}
      <div className="flex justify-center">
        <ShareTwitterButton
          className="px-8"
          shareLink={shareTwitterListedLink(txResults, config)}
        >
          <div
            style={{ gap: '5px' }}
            className="flex items-center justify-center text-base"
          >
            <FaTwitter />
            Share on Twitter!
          </div>
        </ShareTwitterButton>
      </div>
      <PoweredByFooter />
    </div>
  )
}
