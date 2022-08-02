import { css } from '@emotion/react'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useState } from 'react'

import { Tooltip } from './Tooltip'

type Option<T> = {
  label: string | React.ReactNode
  value: T
  tooltip?: string
  disabled?: boolean
}

type Props<T> = {
  colorized?: boolean
  placeholder?: string
  options: Option<T>[]
  defaultOption?: Option<T>
  onChange?: (arg: Option<T>) => void
}

export const TabSelector = <T,>({
  colorized,
  defaultOption,
  onChange,
  options = [],
}: Props<T>) => {
  const { config } = useProjectConfig()
  const [value, setValue] = useState<Option<T> | undefined>(defaultOption)
  return (
    <div className="flex rounded-lg border-[1px] border-border bg-dark-4">
      {options.map((o, i) => (
        <Tooltip key={i} title={o.tooltip || ''}>
          <div
            className={`flex items-center justify-between rounded-lg px-5 py-2 text-sm text-light-0 transition-colors ${
              o.disabled
                ? 'cursor-default opacity-25'
                : 'cursor-pointer hover:text-primary'
            } ${value?.value === o.value ? 'bg-dark-6' : ''}`}
            css={css`
              ${!o.disabled &&
              colorized &&
              css`
                &:hover {
                  color: ${config.colors.accent} !important;
                }
              `}
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
