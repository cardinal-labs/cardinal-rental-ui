import { IoMdClose } from 'react-icons/io'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  variant: 'error' | 'success'
  showClose?: boolean
}

export const Alert: React.FC<Props> = ({
  variant,
  showClose,
  children,
  className,
  onClick,
}: Props) => {
  return {
    error: (
      <div
        className={`${className} relative flex items-center justify-center rounded-xl border-[1px] border-red-500 bg-red-500 bg-opacity-25 p-4 text-light-2 ${
          onClick && 'cursor-pointer'
        }`}
        onClick={onClick}
      >
        <div className="pr-4" style={{ wordBreak: 'break-word' }}>
          {children}
        </div>
        {showClose && (
          <div className="absolute top-4 right-4">
            <IoMdClose />
          </div>
        )}
      </div>
    ),
    success: (
      <div
        className={`${className} relative flex items-center justify-center rounded-xl border-[1px] border-secondary bg-secondary bg-opacity-25 p-4 text-light-2 ${
          onClick && 'cursor-pointer'
        }`}
        onClick={onClick}
      >
        <div className="pr-4" style={{ wordBreak: 'break-word' }}>
          {children}
        </div>
        {showClose && (
          <div className="absolute top-4 right-4">
            <IoMdClose />
          </div>
        )}
      </div>
    ),
  }[variant]
}
