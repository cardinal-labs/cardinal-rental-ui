import { DisplayAddress } from '@cardinal/namespaces-components'
import type { TokenData } from 'apis/api'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import { FaLink } from 'react-icons/fa'

import { notify } from './Notification'

export const handleCopy = (shareUrl: string) => {
  navigator.clipboard.writeText(shareUrl)
  notify({
    message: 'Share link copied',
    description: 'Paste this link from your clipboard',
  })
}

interface NFTHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: TokenData
}

export const NFTHeader: React.FC<NFTHeaderProps> = ({
  tokenData,
}: NFTHeaderProps) => {
  const { config } = useProjectConfig()
  const { secondaryConnection } = useEnvironmentCtx()
  return (
    <div
      className="flex w-full cursor-pointer flex-col justify-between"
      onClick={() =>
        handleCopy(
          getLink(
            `/${config.name}/claim/${tokenData.tokenManager?.pubkey.toBase58()}`
          )
        )
      }
    >
      <div className="flex items-center gap-2 font-bold">
        <div className="w-fit overflow-hidden text-ellipsis whitespace-nowrap text-left text-lg">
          {tokenData.metaplexData?.parsed?.data.name}
        </div>
        <div className="flex w-fit">
          <FaLink />
        </div>
      </div>
      <div className="text-sm text-light-2">
        <DisplayAddress
          connection={secondaryConnection}
          address={tokenData.tokenManager?.parsed.issuer || undefined}
          height="18px"
          width="100px"
          dark={true}
        />
      </div>
    </div>
  )
}
