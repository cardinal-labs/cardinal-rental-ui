import { capitalizeFirstLetter } from '@cardinal/common'
import { css } from '@emotion/react'
import { useEffect, useState } from 'react'
import { AiOutlineMinus, AiOutlinePlus } from 'react-icons/ai'

import { Selector } from './Selector'

export type DurationOption =
  | 'minutes'
  | 'hours'
  | 'days'
  | 'weeks'
  | 'months'
  | 'years'

export const DURATION_DATA: { [key in DurationOption]: number } = {
  minutes: 60,
  hours: 3600,
  days: 86400,
  weeks: 604800,
  months: 2419200,
  years: 31449600,
}

export const SECONDS_TO_DURATION: { [key in number]: DurationOption } = {
  60: 'minutes',
  3600: 'hours',
  86400: 'days',
  604800: 'weeks',
  2419200: 'months',
  31449600: 'years',
}

export const largestDurationOptionForSeconds = (
  seconds: number
): [DurationOption, number] => {
  const sortedOptions = Object.entries(DURATION_DATA).sort(
    ([, v1], [, v2]) => v2 - v1
  ) as [DurationOption, number][]
  const ix = sortedOptions.findIndex((e) => e[1] > seconds)
  return sortedOptions[ix ? Math.min(0, ix - 1) : sortedOptions.length - 1]!
}

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  defaultOption?: DurationOption
  defaultAmount?: number
  disabled?: boolean
  durationData?: { [key in DurationOption]: number }
  handleChange?: (v: number) => void
}

export const DurationInput: React.FC<Props> = ({
  disabled,
  defaultOption,
  handleChange,
  defaultAmount = 1,
  durationData = DURATION_DATA,
}: Props) => {
  const [durationAmount, setDurationAmount] = useState<number>(defaultAmount)
  const [durationOption, setDurationOption] = useState<DurationOption>(
    defaultOption ?? 'days'
  )
  useEffect(() => {
    handleChange && handleChange(durationAmount * durationData[durationOption]!)
  }, [durationOption, durationAmount])

  return (
    <div className="flex gap-1">
      <div className="relative flex">
        <input
          disabled={disabled}
          className="w-full rounded-xl border border-border bg-dark-4 py-2 px-3 text-light-0 placeholder-medium-3 outline-none transition-all focus:border-primary"
          type="text"
          inputMode="numeric"
          css={css`
            line-height: 20px;
          `}
          placeholder="# of..."
          min="0"
          step={1}
          value={`${durationAmount}`}
          onChange={(e) => setDurationAmount(parseInt(e.target.value) || 0)}
        />
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 transform items-center justify-center gap-1">
          <button
            onClick={() => setDurationAmount(Math.max(0, durationAmount - 1))}
          >
            <AiOutlineMinus
              className="opacity-50 hover:opacity-100"
              style={{ height: '16px', width: '16px' }}
            />
          </button>
          <button
            onClick={() => setDurationAmount(Math.max(0, durationAmount + 1))}
          >
            <AiOutlinePlus
              className="opacity-50 hover:opacity-100"
              style={{ height: '16px', width: '16px' }}
            />
          </button>
        </div>
      </div>
      <Selector<DurationOption>
        disabled={disabled}
        className="w-max rounded-xl"
        onChange={(e) => setDurationOption(e?.value ?? 'days')}
        defaultOption={{
          value: durationOption,
          label: capitalizeFirstLetter(durationOption).substring(
            0,
            durationOption.length - 1
          ),
        }}
        options={Object.keys(DURATION_DATA).map((option) => ({
          label: capitalizeFirstLetter(option).substring(0, option.length - 1),
          value: option as DurationOption,
        }))}
      />
    </div>
  )
}
