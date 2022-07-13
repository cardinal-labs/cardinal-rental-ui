import styled from '@emotion/styled'
import { useState } from 'react'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'

export type ButtonSmallProps = {
  disabled?: boolean
  bgColor?: string
}

export type Props = {
  children: JSX.Element | string
  className?: string
  onClick?: () => void
} & ButtonSmallProps

export const StyledButtonSmall = styled.button<ButtonSmallProps>`
  color: white;
  cursor: ${({ disabled }) => !disabled && 'pointer'};
  opacity: ${({ disabled }) => (disabled ? '0.5' : '1')};
  border: none;
  outline: none;
  padding: 8px 12px;
  white-space: break-spaces;
  transition: background 0.2s, box-shadow 0.2s;
  &:hover {
    background: ${({ disabled }) => (!disabled ? '#1a1a1a' : '')};
    box-shadow: ${({ disabled }) =>
      !disabled
        ? `0px 4px 8px -4px rgba(0, 0, 0, 0.05),
      inset 0px -1px 1px rgba(0, 0, 0, 0.04),
      inset 0px 2px 0px rgba(255, 255, 255, 0.05)`
        : ''};
  }
`

export const ButtonSmall: React.FC<Props> = ({
  children,
  onClick,
  className,
  ...buttonProps
}: Props) => {
  const [loading, setLoading] = useState(false)
  return (
    <StyledButtonSmall
      {...buttonProps}
      className={`flex items-center justify-center gap-1 rounded-2xl bg-dark-6 text-xs ${className}`}
      onClick={async () => {
        if (!onClick) return
        try {
          setLoading(true)
          await onClick()
        } finally {
          setLoading(false)
        }
      }}
    >
      {loading ? <LoadingSpinner height="25px" /> : children}
    </StyledButtonSmall>
  )
}
