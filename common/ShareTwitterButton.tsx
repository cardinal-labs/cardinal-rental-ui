import { css } from '@emotion/react'
import type { TokenData } from 'apis/api'
import type { ProjectConfig } from 'config/config'
import type { IssueTxResult } from 'handlers/useHandleIssueRental'

type Props = {
  children: string | JSX.Element
  className?: string
  disabled?: boolean
  shareLink: string
}

export const shareTwitterClaimedLink = (
  tokenData: TokenData,
  config: ProjectConfig,
  issuerName?: string
) => {
  return [
    `https://twitter.com/intent/tweet?text=`,
    encodeURIComponent(
      `I just rented ${
        tokenData.metaplexData?.parsed.data.name
          ? `${config.twitterHandle ? `${config.twitterHandle} ` : ''}${
              tokenData.metaplexData?.parsed.data.name
            }`
          : `a ${config.twitterHandle ? `${config.twitterHandle} ` : ''}NFT`
      }${
        issuerName ? ` from ${issuerName}` : ''
      } using @cardinal_labs rental UI! Check it out at https://rent-v2.cardinal.so/claim/${tokenData.tokenManager?.pubkey.toString()}`
    ),
  ].join('')
}

export const shareTwitterListedLink = (
  txResults: IssueTxResult[],
  config: ProjectConfig
) => {
  return [
    `https://twitter.com/intent/tweet?text=`,
    encodeURIComponent(
      txResults.length === 1
        ? `I just listed ${
            txResults[0]!.tokenData.metaplexData?.parsed.data.name
              ? `${config.twitterHandle ? `${config.twitterHandle} ` : ''}${
                  txResults[0]!.tokenData.metaplexData?.parsed.data.name
                }`
              : `a ${config.twitterHandle ? `${config.twitterHandle} ` : ''}NFT`
          } for rent using @cardinal_labs rental UI! Check it out at ${
            txResults[0]!.claimLink
          }`
        : `I just listed ${txResults.length} ${
            config.twitterHandle ? `${config.twitterHandle} ` : ''
          }NFTs! Check it out at https://rent-v2.cardinal.so/${config.name}`
    ),
  ].join('')
}

export const ShareTwitterButton: React.FC<Props> = ({
  children,
  className,
  disabled,
  shareLink,
  ...rest
}: Props) => {
  return (
    <a
      {...rest}
      className={`flex items-center justify-center gap-5 rounded-xl transition-all ${className} ${
        disabled ? 'cursor-default bg-medium-4' : 'cursor-pointer bg-twitter'
      }`}
      css={css`
        &:hover {
          filter: brightness(115%);
        }
      `}
      target="_blank"
      rel="noreferrer"
      href={shareLink}
    >
      <div className="flex items-center justify-center gap-1">
        {children && (
          <div
            className={`py-3 ${disabled ? 'text-medium-3' : 'text-light-0'}`}
          >
            {children}
          </div>
        )}
      </div>
    </a>
  )
}
