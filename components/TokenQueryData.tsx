import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { css } from '@emotion/react'
import type { TokenData } from 'apis/api'
import { GlyphLargeClose } from 'assets/GlyphLargeClose'
import { Card } from 'common/Card'
import { NFT } from 'common/NFT'
import { NFTClaimButton } from 'common/NFTClaimButton'
import { NFTHeader } from 'common/NFTHeader'
import { NFTIssuerInfo } from 'common/NFTIssuerInfo'
import { NFTRevokeButton } from 'common/NFTRevokeButton'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useEffect, useState } from 'react'

import { isSelected } from './TokenQueryResults'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  tokenDatas?: TokenData[]
  isFetched?: boolean
  isFetching?: boolean
  refetch?: () => void
  selectedTokens?: TokenData[]
  handleClick?: (tokenData: TokenData) => void
}

export const PAGE_SIZE = 5
export const DEFAULT_PAGE: [number, number] = [2, 0]

export const TokenQueryData: React.FC<Props> = ({
  tokenDatas,
  isFetched,
  selectedTokens,
  handleClick,
}: Props) => {
  const { config } = useProjectConfig()
  const [pageNum, setPageNum] = useState<[number, number]>(DEFAULT_PAGE)

  useEffect(() => {
    setPageNum(DEFAULT_PAGE)
  }, [
    tokenDatas
      ?.map((tokenData) => tokenData.metaplexData?.parsed.mint)
      .join(','),
  ])

  useEffect(() => {
    const onScroll = (event: Event) => {
      const { scrollHeight, scrollTop, clientHeight } =
        // @ts-ignore
        event.target?.scrollingElement
      if (scrollHeight - scrollTop <= clientHeight * 1.5) {
        setPageNum(([n, prevScrollHeight]) => {
          return prevScrollHeight !== scrollHeight
            ? [n + 1, scrollHeight]
            : [n, prevScrollHeight]
        })
      }
    }
    document.addEventListener('scroll', onScroll)
    return () => document.removeEventListener('scroll', onScroll)
  }, [pageNum])

  return (
    <div className="mx-auto mt-12 px-10">
      {!isFetched ? (
        <div className="flex flex-wrap justify-center gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          <Card skeleton header={<></>} subHeader={<></>} />
          <Card skeleton header={<></>} subHeader={<></>} />
          <Card skeleton header={<></>} subHeader={<></>} />
          <Card skeleton header={<></>} subHeader={<></>} />
          <Card skeleton header={<></>} subHeader={<></>} />
          <Card skeleton header={<></>} subHeader={<></>} />
          <Card skeleton header={<></>} subHeader={<></>} />
          <Card skeleton header={<></>} subHeader={<></>} />
        </div>
      ) : tokenDatas && tokenDatas.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {tokenDatas?.slice(0, PAGE_SIZE * pageNum[0]).map((tokenData) => (
            <Card
              key={`${tokenData.tokenManager?.pubkey.toString()}-${tokenData.tokenAccount?.pubkey.toString()}`}
              className={`${handleClick && 'cursor-pointer'} ${
                isSelected(tokenData, selectedTokens ?? [])
                  ? 'border-[1px] border-secondary'
                  : ''
              }`}
              css={css`
                box-shadow: ${isSelected(tokenData, selectedTokens ?? [])
                  ? `0px 0px 30px ${config.colors.accent}`
                  : ''};
              `}
              onClick={() => {
                handleClick && handleClick(tokenData)
              }}
              hero={<NFT tokenData={tokenData} />}
              header={<NFTHeader tokenData={tokenData} />}
              content={
                {
                  [TokenManagerState.Initialized]: <></>,
                  [TokenManagerState.Issued]: (
                    <div className="flex h-full w-full flex-row items-center justify-between text-sm">
                      <NFTIssuerInfo tokenData={tokenData} />
                      <NFTClaimButton
                        tokenData={tokenData}
                        tokenDatas={tokenDatas}
                      />
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
          ))}
        </div>
      ) : (
        <div className="my-40 flex w-full flex-col items-center justify-center gap-1">
          <GlyphLargeClose />
          <div className="mt-4 text-medium-4">
            No active {config.displayName} results at this moment...
          </div>
        </div>
      )}
    </div>
  )
}
