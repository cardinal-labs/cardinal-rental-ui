import { css } from '@emotion/react'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: string
}
export const Pill: React.FC<Props> = ({
  children,
  className,
  ...props
}: Props) => {
  return (
    <div
      {...props}
      className={`${className} rounded-xl bg-dark-6 bg-opacity-60 px-2 py-[10px]`}
      css={css`
        backdrop-filter: blur(24px);
      `}
    >
      {children}
    </div>
  )
}
