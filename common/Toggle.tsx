import { useState } from 'react'

import { Tooltip } from './Tooltip'

type Props = {
  defaultValue: boolean
  tooltip?: string
  disabled?: boolean
  onChange?: (arg: boolean) => void
}

export const Toggle = ({
  defaultValue,
  tooltip,
  disabled,
  onChange,
}: Props) => {
  const [value, setValue] = useState(defaultValue)
  return (
    <Tooltip title={tooltip || ''}>
      <div
        className={`relative h-6 w-10 rounded-xl border-[2px] text-sm text-light-0 transition-colors ${
          disabled ? 'cursor-default opacity-25' : 'cursor-pointer'
        } ${
          value
            ? 'border-primary-hover bg-primary'
            : 'border-medium-3 bg-medium-3'
        }`}
        onClick={() => {
          if (disabled) return
          setValue(!value)
          onChange && onChange(!value)
        }}
      >
        <div
          className={`absolute h-5 w-5 rounded-full bg-white transition-all ${
            value ? 'left-4' : 'left-0'
          }`}
        />
      </div>
    </Tooltip>
  )
}
