import { css } from '@emotion/react'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

import { HeroSmall } from './HeroSmall'
import { HeroStats } from './HeroStats'
import { SocialIcon } from './Socials'

export const HeroLarge: React.FC = () => {
  const { config } = useProjectConfig()
  if (!config.hero) return <HeroSmall />
  return (
    <div className="flex w-full flex-wrap items-stretch justify-center gap-16 py-8 px-6 lg:mb-8 lg:flex-nowrap lg:justify-between lg:gap-32 lg:px-10">
      <div className="relative w-full flex-grow">
        <img
          className="min-h-[200px] w-full rounded-xl"
          src={config.hero}
          alt={config.name}
        />
        <div className="absolute left-8 flex h-24 w-24 -translate-y-[65%] items-center justify-center overflow-hidden rounded-full border-4 border-border bg-dark-5 lg:h-32 lg:w-32">
          <img
            className={`w-full ${config.logoPadding && 'p-3'}`}
            src={config.logoImage}
            alt={config.name}
          />
        </div>
      </div>
      <div className="flex w-full flex-grow flex-col justify-between py-4">
        <div className="mb-6 flex flex-col gap-6">
          <div className="text-4xl text-light-0">{config.displayName}</div>
          <div className="text-lg text-medium-3">{config.description}</div>
          <div className="flex gap-4 text-light-0">
            {config.socialLinks?.map(({ icon, link }, i) => {
              return (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className={`cursor-pointer text-xl text-light-0 transition-all duration-300 hover:text-primary`}
                  css={css`
                    &:hover {
                      color: ${config.colors.accent} !important;
                    }
                  `}
                >
                  <SocialIcon iconKey={icon} />
                </a>
              )
            })}
          </div>
        </div>
        <HeroStats />
      </div>
    </div>
  )
}
