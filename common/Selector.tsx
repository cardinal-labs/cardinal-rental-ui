import { css } from '@emotion/react'
import { ChevronDown } from 'assets/ChevronDown'
import { ChevronRight } from 'assets/ChevronRight'
import { GlyphSelectClear } from 'assets/GlyphSelectClear'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useEffect, useRef, useState } from 'react'

type Option<T> = { label: string; value: T }
type Props<T> = {
  placeholder?: string
  options: Option<T>[]
  className?: string
  disabled?: boolean
  defaultOption?: Option<T>
  isClearable?: boolean
  onChange?: (arg?: Option<T>) => void
  colorized?: boolean
}

export const Selector = <T,>({
  placeholder = 'Select',
  defaultOption,
  disabled,
  className,
  onChange,
  isClearable,
  options = [],
  colorized,
}: Props<T>) => {
  const { config } = useProjectConfig()
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState<Option<T> | undefined>(defaultOption)
  const ref = useRef(null)
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      // @ts-ignore
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [ref])

  return (
    <div className="relative z-40 text-base" ref={ref}>
      <div
        className={`flex justify-between gap-2 rounded-lg border-[1px] border-border bg-dark-4 px-3 py-2 transition-all ${
          disabled
            ? 'cursor-default opacity-50'
            : 'cursor-pointer hover:border-primary'
        } ${className}`}
        css={
          colorized &&
          css`
            &:hover {
              border-color: ${config.colors.accent} !important;
            }
          `
        }
        onClick={() => !disabled && setIsOpen((v) => !v)}
      >
        {value ? (
          <div className="text-light-0">{value.label}</div>
        ) : (
          <div className="text-medium-3">{placeholder}</div>
        )}
        <div className="flex items-center gap-1">
          {isClearable && value ? (
            <div
              className={`opacity-80 hover:opacity-100`}
              onClick={(e) => {
                e.stopPropagation()
                setValue(undefined)
                onChange && onChange(undefined)
              }}
            >
              <GlyphSelectClear />
            </div>
          ) : (
            <ChevronDown />
          )}
        </div>
      </div>
      <div
        className={`absolute w-full rounded-md bg-dark-4 transition-all ${
          isOpen ? 'h-auto opacity-100' : 'h-0 overflow-hidden opacity-0'
        }`}
      >
        {options.map((o) => (
          <div
            key={o.label}
            className="flex cursor-pointer items-center justify-between p-3 text-light-0 transition-colors hover:text-primary"
            css={
              colorized &&
              css`
                &:hover {
                  color: ${config.colors.accent} !important;
                }
              `
            }
            onClick={() => {
              setValue(o)
              setIsOpen((v) => !v)
              onChange && onChange(o)
            }}
          >
            <div>{o.label}</div>
            <ChevronRight />
          </div>
        ))}
      </div>
    </div>
  )
}
