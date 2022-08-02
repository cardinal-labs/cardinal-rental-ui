import { useState } from 'react'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'

type Props = {
  children: string | JSX.Element
  icon?: JSX.Element
  count?: number
  className?: string
  variant: 'primary' | 'secondary' | 'tertiary'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
}

export const Button: React.FC<Props> = ({
  children,
  onClick,
  className,
  icon,
  count,
  disabled,
  variant,
  loading,
  ...rest
}: Props) => {
  const [loadingClick, setLoadingClick] = useState(false)

  return (
    <div
      {...rest}
      className={`flex items-center justify-center gap-5 rounded-xl transition-all ${className} ${
        disabled
          ? 'cursor-default bg-medium-4'
          : variant === 'primary'
          ? 'cursor-pointer bg-primary hover:bg-primary-hover'
          : 'cursor-pointer border-[1px] border-medium-4 hover:border-primary'
      }`}
      onClick={async () => {
        if (!onClick || disabled) return
        try {
          setLoadingClick(true)
          await onClick()
        } finally {
          setLoadingClick(false)
        }
      }}
    >
      {loading || loadingClick ? (
        <LoadingSpinner height="25px" />
      ) : (
        <div className="flex items-center justify-center gap-1">
          {children && (
            <div
              className={`py-3 ${disabled ? 'text-medium-3' : 'text-light-0'}`}
            >
              {children}
            </div>
          )}
          {count && (
            <div className="color-primary h-4 w-4 rounded-full bg-white text-xs text-transparent">
              {count}
            </div>
          )}
          {icon && icon}
        </div>
      )}
    </div>
  )
}
