import { css } from '@emotion/react'
import { ChevronDown } from 'assets/ChevronDown'
import { ChevronRight } from 'assets/ChevronRight'
import { lighten } from 'polished'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useEffect, useRef, useState } from 'react'

type Option<T> = { label: string; value: T }
type Props<T> = {
  placeholder?: string
  defaultValue?: React.ReactNode
  colorized?: boolean
  groups: {
    type?: 'radio'
    label: string
    content?: React.ReactNode
    options?: Option<T>[]
  }[]
  onChange?: (arg: Option<T>) => void
}

export const MultiSelector = <T,>({
  placeholder = 'Select',
  defaultValue,
  colorized,
  onChange,
  groups = [],
}: Props<T>) => {
  const { config } = useProjectConfig()
  const [isOpen, setIsOpen] = useState(false)
  const [openSelectors, setOpenSelectors] = useState<string[]>([])
  const [value, setValue] = useState<Option<T>>()
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
        className="flex min-w-[250px] cursor-pointer justify-between rounded-lg border-[1px] border-border bg-dark-4 px-3 py-2 transition-all hover:border-primary"
        css={
          colorized &&
          css`
            background: ${lighten(0.08, config.colors.main)} !important;
            &:hover {
              border-color: ${config.colors.secondary} !important;
            }
          `
        }
        onClick={() => setIsOpen((v) => !v)}
      >
        {value ? (
          <div className="text-light-0">{value.label}</div>
        ) : defaultValue ? (
          defaultValue
        ) : (
          <div className="text-medium-3">{placeholder}</div>
        )}
        <ChevronDown />
      </div>
      {isOpen && (
        <div
          className={`absolute max-h-[50vh] w-full overflow-scroll rounded-md transition-all ${
            isOpen ? 'h-auto opacity-100' : 'h-0 overflow-hidden opacity-0'
          }`}
        >
          {groups.map(({ type, label, options, content }, i) =>
            !openSelectors.includes(label) ? (
              <div
                key={i}
                className="flex cursor-pointer items-center justify-between border-b-border bg-dark-4 p-3 text-light-0 transition-colors hover:text-primary"
                css={css`
                  border-bottom-width: ${i < groups?.length - 1 ? '1px' : ''};
                  ${colorized &&
                  css`
                    background: ${lighten(0.03, config.colors.main)} !important;
                    &:hover {
                      color: ${config.colors.secondary} !important;
                    }
                  `}
                `}
                onClick={() => setOpenSelectors((v) => [...v, label])}
              >
                <div>{label}</div>
                <ChevronRight />
              </div>
            ) : (
              <div
                className="border-b-border bg-dark-5"
                css={css`
                  border-bottom-width: ${i < groups?.length - 1 ? '1px' : ''};
                  ${colorized &&
                  css`
                    background: ${lighten(0.03, config.colors.main)} !important;
                    &:hover {
                      color: ${config.colors.secondary} !important;
                    }
                  `}
                `}
              >
                <div
                  key={i}
                  className="flex cursor-pointer items-center justify-between p-3 text-light-0 transition-colors hover:text-primary"
                  onClick={() =>
                    setOpenSelectors((v) => v.filter((l) => l !== label))
                  }
                  css={
                    colorized &&
                    css`
                      &:hover {
                        color: ${config.colors.secondary} !important;
                      }
                    `
                  }
                >
                  <div>{label}</div>
                  <ChevronDown size={14} />
                </div>
                {content ??
                  {
                    radio: (
                      <div key={i} className="flex flex-col gap-1 px-4 py-4">
                        {options?.map((o) => (
                          <div
                            key={o.label}
                            className="flex items-center justify-between"
                            onClick={() => {
                              setValue(o)
                              setIsOpen((v) => !v)
                              onChange && onChange(o)
                            }}
                          >
                            <div
                              className="flex cursor-pointer items-center gap-2 text-light-0 transition-colors hover:text-primary"
                              css={css`
                                &:hover {
                                  ${colorized &&
                                  css`
                                    color: ${config.colors
                                      .secondary} !important;
                                  `}
                                  div {
                                    border-color: rgb(
                                      144 126 255 / var(--tw-border-opacity)
                                    );
                                  }
                                }
                              `}
                            >
                              <div className="h-4 w-4 rounded-[3px] border-[.5px] border-light-1 transition-all">
                                {}
                              </div>
                              <div>{o.label}</div>
                            </div>
                            <div></div>
                          </div>
                        ))}
                      </div>
                    ),
                  }[type ?? 'radio']}
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
