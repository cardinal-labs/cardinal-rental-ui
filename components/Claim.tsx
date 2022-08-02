import type { AccountData } from '@cardinal/common'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { css } from '@emotion/react'
import type { TokenData } from 'apis/api'
import { convertStringsToPubkeys } from 'apis/api'
import { tryPublicKey } from 'apis/utils'
import { GlyphQuestion } from 'assets/GlyphQuestion'
import { ButtonSmall } from 'common/ButtonSmall'
import { Card } from 'common/Card'
import { FooterSlim } from 'common/FooterSlim'
import { HeaderSlim } from 'common/HeaderSlim'
import { NFT } from 'common/NFT'
import { NFTClaimButton } from 'common/NFTClaimButton'
import { NFTHeader } from 'common/NFTHeader'
import { NFTIssuerInfo } from 'common/NFTIssuerInfo'
import { NFTRevokeButton } from 'common/NFTRevokeButton'
import { StyledBackground } from 'common/StyledBackground'
import ClaimQRCode from 'components/ClaimQRCode'
import { useOtp } from 'hooks/useOtp'
import { useTokenData } from 'hooks/useTokenData'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { transparentize } from 'polished'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useState } from 'react'
import { isMobile } from 'react-device-detect'
import { BiQr } from 'react-icons/bi'

function Claim(props: { tokenDataString: string }) {
  const { configFromToken } = useProjectConfig()
  const router = useRouter()
  const [showQRCode, setShowQRCode] = useState(false)
  const otpKeypair = useOtp()

  const { tokenManagerString, qrcode } = router.query
  const tokenManagerId = tryPublicKey(tokenManagerString)
  const tokenQuery = useTokenData(tokenManagerId ?? undefined)
  const tokenData = convertStringsToPubkeys(
    JSON.parse(props.tokenDataString)
  ) as TokenData & { metadata: AccountData<any> }
  const config = configFromToken(tokenData)

  return (
    <div className="flex h-screen flex-col">
      <Head>
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@cardinal_labs" />
        <meta
          name="twitter:title"
          content={
            tokenData.tokenManager?.parsed.state === TokenManagerState.Claimed
              ? `Just claimed ${tokenData.metaplexData?.parsed.data.name} on Cardinal's NFT Rental Marketplace`
              : `Rent ${tokenData.metaplexData?.parsed.data.name} on Cardinal's NFT Rental Marketplace`
          }
        />
        <meta
          name="twitter:description"
          content="Rent and Claim your favorite NFTs on Cardinal's Rental Marketplace"
        />
        <meta
          name="twitter:image"
          content={`${
            process.env.NEXT_PUBLIC_BASE_URL
          }/api/generateTwitterImage?nftImageUri=${
            tokenData.metadata?.parsed.image
          }${
            tokenData.tokenManager?.parsed.state === TokenManagerState.Claimed
              ? '&claimed=true'
              : ''
          }`}
        />
      </Head>
      <HeaderSlim />
      <div className="mx-auto w-[500px] max-w-[86vw] flex-grow pt-[4vh] lg:pt-[5vh]">
        <div className="mb-6 text-center">
          <div className="mb-2 text-4xl">Claim Asset</div>
          <span className="mt-1 inline-block rounded-md bg-gray-800 py-2 px-4 text-lg">
            {config.displayName}
          </span>
        </div>
        <div
          className="relative mx-auto flex w-fit flex-col items-center rounded-xl text-white"
          css={css`
            box-shadow: 0 0 80px 50px ${
              config.colors.accent
                ? transparentize(0.8, config.colors.accent)
                : 'rgba(255, 255, 255, 0.3)'
            }};
          `}
        >
          {true && (
            <div
              className="absolute -right-5 -top-5 h-[10px] w-[10px] animate-ping rounded-full"
              css={css`
                background: ${config.colors.accent};
              `}
            />
          )}
          <div className="">
            {!tokenQuery.isFetched ? (
              <Card skeleton header={<></>} subHeader={<></>} />
            ) : tokenData ? (
              <Card
                className="max-w-[400px]"
                hero={
                  tokenData &&
                  showQRCode &&
                  !isMobile &&
                  tokenData.tokenManager?.parsed.state !==
                    TokenManagerState.Claimed ? (
                    <ClaimQRCode tokenData={tokenData} keypair={otpKeypair} />
                  ) : (
                    <NFT tokenData={tokenData} />
                  )
                }
                header={<NFTHeader tokenData={tokenData} />}
                content={
                  {
                    [TokenManagerState.Initialized]: <></>,
                    [TokenManagerState.Issued]: (
                      <div className="flex h-full w-full flex-row items-center justify-between text-sm">
                        <NFTIssuerInfo tokenData={tokenData} />
                        {qrcode && !isMobile ? (
                          <ButtonSmall
                            className="my-auto inline-block flex-none text-xs"
                            onClick={() => setShowQRCode((v) => !v)}
                          >
                            <div className="flex items-center gap-1">
                              {showQRCode ? 'Hide' : 'Scan'}
                              <BiQr />
                            </div>
                          </ButtonSmall>
                        ) : (
                          <NFTClaimButton
                            tokenData={tokenData}
                            tokenDatas={[]}
                          />
                        )}
                      </div>
                    ),
                    [TokenManagerState.Claimed]: (
                      <div className="flex h-full flex-row justify-between text-sm">
                        <NFTIssuerInfo tokenData={tokenData} />
                        <NFTRevokeButton tokenData={tokenData} />
                      </div>
                    ),
                    [TokenManagerState.Invalidated]: <></>,
                  }[tokenData?.tokenManager?.parsed.state as TokenManagerState]
                }
              />
            ) : (
              <Card
                hero={
                  <div className="flex h-full w-[280px] flex-col items-center justify-center">
                    <div className="scale-[1.5]">
                      <GlyphQuestion />
                    </div>
                    <div className="mt-10">Token not found</div>
                  </div>
                }
                header={<div className="m"></div>}
              />
            )}
          </div>
        </div>
        {tokenQuery.error && (
          <div className="mt-8 text-center text-xs text-medium-3">{`
            ${tokenQuery.error}`}</div>
        )}
        {qrcode && (
          <div className="mx-auto mt-6 py-3 px-10 text-center text-xs text-medium-3">
            Click the scan button to claim this NFT with your mobile wallet and
            be prepared to present it at the front desk.
          </div>
        )}
      </div>
      <FooterSlim />
      <StyledBackground colors={config.colors} />
    </div>
  )
}

export default Claim
