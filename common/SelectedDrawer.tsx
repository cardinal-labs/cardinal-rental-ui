import { css } from '@emotion/react'
import type { TokenData } from 'apis/api'
import { GlyphClose } from 'assets/GlyphClose'
import { useRentalIssueCard } from 'rental-components/components/RentalIssueCard'

import { Button } from './Button'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  selectedTokens: TokenData[]
  onClose?: () => void
}

export const SelecterDrawer: React.FC<Props> = ({
  selectedTokens,
  onClose,
}: Props) => {
  const rentalIsseuCard = useRentalIssueCard()
  return (
    <div
      className={`fixed z-30 flex w-full items-center justify-between gap-4 bg-dark-6 px-4 py-8 transition-all lg:px-12 ${
        selectedTokens.length > 0 ? 'bottom-0' : '-bottom-52'
      }`}
      css={css`
        box-shadow: 0px 144px 100px 200px rgba(12, 12, 13, 1);
      `}
    >
      <div className="text-lg">
        You selected {selectedTokens.length ? `(${selectedTokens.length})` : ''}{' '}
        items
      </div>
      <div className="flex items-center gap-2">
        <Button
          disabled={selectedTokens.length === 0}
          variant="primary"
          className="px-4 lg:px-8"
          onClick={() =>
            rentalIsseuCard.showModal({
              tokenDatas: selectedTokens,
            })
          }
        >
          Rent out
        </Button>
        <div className="mx-4 h-8 w-[2px] bg-border"></div>
        <div className="cursor-pointer" onClick={() => onClose && onClose()}>
          <GlyphClose />
        </div>
      </div>
    </div>
  )
}
