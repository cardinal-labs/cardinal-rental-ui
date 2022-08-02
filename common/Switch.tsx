import { css } from '@emotion/react'
import { useState } from 'react'

import { Tooltip } from './Tooltip'

type Option<T> = {
  label: string | React.ReactNode
  value: T
  tooltip?: string
  disabled?: boolean
}

type Props<T> = {
  options: Option<T>[]
  defaultOption?: Option<T>
  onChange?: (arg: Option<T>) => void
}

export const Switch = <T,>({
  defaultOption,
  onChange,
  options = [],
}: Props<T>) => {
  const [value, setValue] = useState<Option<T> | undefined>(defaultOption)
  return (
    <div className="inline-flex justify-center rounded-xl bg-medium-4">
      {options.map((o, i) => (
        <Tooltip key={i} title={o.tooltip || ''}>
          <div
            className={`flex items-center justify-between rounded-xl px-3 py-[2px] text-sm text-light-0 transition-colors ${
              o.disabled ? 'cursor-default opacity-25' : 'cursor-pointer'
            } ${value?.value === o.value ? 'bg-primary' : 'bg-none'}`}
            css={css`
              box-shadow: ${value?.value === o.value
                ? '0px 4px 6px rgba(0, 0, 0, 0.25)'
                : ''};
            `}
            onClick={() => {
              if (o.disabled) return
              setValue(o)
              onChange && onChange(o)
            }}
          >
            <div>{o.label}</div>
          </div>
        </Tooltip>
      ))}
    </div>
  )
}
