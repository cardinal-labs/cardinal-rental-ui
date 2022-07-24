import { css } from '@emotion/react'
import { GlyphPlus } from 'assets/GlyphPlus'
import { MoneyGlow, MoneyGlowSecondary } from 'assets/MoneyGlow'
import { RentGlow, RentGlowSecondary } from 'assets/RentGlow'
import { WalletGlow, WalletGlowSecondary } from 'assets/WalletGlow'
import { Card } from 'common/Card'
import { FooterSlim } from 'common/FooterSlim'
import { Glow } from 'common/Glow'
import { HeaderSlim } from 'common/HeaderSlim'
import { Stats } from 'common/Stats'
import type { ProjectConfig } from 'config/config'
import { projectConfigs } from 'config/config'
import { queryId, useGlobalStats } from 'hooks/useGlobalStats'
import { useRouter } from 'next/router'
import { lighten, transparentize } from 'polished'

export const Collections = () => {
  const router = useRouter()
  const stats = useGlobalStats()

  const categories = Object.entries(projectConfigs).reduce(
    (acc, [, config]) => {
      if (config.hidden) return acc
      return {
        ...acc,
        [config.type]: [...(acc[config.type] || []), config],
      }
    },
    {} as { [type: string]: ProjectConfig[] }
  )

  return (
    <div className="bg-[#0B0B0B]">
      <div
        css={css`
          background: linear-gradient(180deg, #140a51 0%, #0b0b0b 100%);
        `}
      >
        <HeaderSlim />
        <div className="flex flex-wrap justify-between gap-10 px-16 py-28">
          <Glow angle={130} scale={1.5}>
            <div className="flex flex-col gap-2">
              <div className="text-5xl text-light-0">
                NFT Rental Marketplace
              </div>
              <div className="text-lg text-medium-3">
                The first NFT Rental Marketplace on Solana. <br />
                Hold the <b>actual NFT</b> and access its utility for the
                duration rented.
              </div>
            </div>
          </Glow>
          <div className="flex flex-col items-end justify-end gap-5 ">
            <div className="flex items-center gap-6">
              <div className="text-lg text-medium-3">
                Are you a collection owner?
              </div>
              <div
                className="flex cursor-pointer items-center gap-1 rounded-lg bg-primary p-3 text-light-0 transition-colors hover:bg-primary-hover"
                onClick={() => {
                  window.open('https://forms.gle/7K1EQ9SWGE93sWHUA')
                }}
              >
                <>Add your collection</>
                <GlyphPlus />
              </div>
            </div>
            <div className="flex w-fit gap-3 rounded-xl border-[2px] border-border p-4">
              <div className="flex items-center gap-2">
                <div className="text-medium-3">Total rentals</div>
                <div className="text-light-0">
                  {stats.data &&
                  stats.data[queryId('global', true)]?.aggregate.count ? (
                    stats.data[queryId('global', true)]!.aggregate.count
                  ) : (
                    <div className="mt-[1px] h-5 w-12 animate-pulse rounded-md bg-border" />
                  )}
                </div>
              </div>
              <div className="w-[2px] bg-border"></div>
              <div className="flex items-center gap-2">
                <div className="text-medium-3">Listed rentals</div>
                <div className="text-light-0">
                  {stats.data &&
                  stats.data[queryId('global', false)]?.aggregate.count ? (
                    stats.data[queryId('global', false)]!.aggregate.count
                  ) : (
                    <div className="mt-[1px] h-5 w-12 animate-pulse rounded-md bg-border" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-10 md:px-0">
        {Object.entries(categories).map(([type, configs], i) => (
          <div key={type}>
            {i > 0 && (
              <div className="mx-auto mt-10 mb-10 h-[2px] w-[90%] rounded-lg bg-border"></div>
            )}
            <div className="grid grid-cols-1 flex-wrap gap-4 md:grid-cols-3 lg:grid-cols-4">
              {configs.map((config) => (
                <div
                  key={config.name}
                  className="bg-opacity-1 cursor-pointer transition-colors"
                  css={css`
                    &:hover {
                      background: ${transparentize(
                        0.7,
                        lighten(0.07, config.colors.main)
                      )};
                    }
                  `}
                  onClick={() =>
                    router.push(`/${config.name}${location.search}`)
                  }
                >
                  <Card
                    badges={config.badges}
                    hero={
                      <div
                        className="flex h-full w-full items-center justify-center p-12"
                        css={css`
                          background: ${lighten(0.07, config.colors.main)};
                        `}
                      >
                        <img
                          className="max-h-full rounded-xl"
                          src={config.logoImage}
                          alt={config.name}
                        />
                      </div>
                    }
                    header={config.displayName}
                    content={
                      <Stats
                        stats={[
                          {
                            header: 'Total rentals',
                            value:
                              stats.data &&
                              stats.data[queryId(config.name, true)]?.aggregate
                                .count !== undefined ? (
                                stats.data[
                                  queryId(config.name, true)
                                ]!.aggregate.count.toString()
                              ) : (
                                <div className="mt-1 h-5 w-12 animate-pulse rounded-md bg-border" />
                              ),
                          },
                          {
                            header: 'Listed rentals',
                            value:
                              stats.data &&
                              stats.data[queryId(config.name, false)]?.aggregate
                                .count !== undefined ? (
                                stats.data[
                                  queryId(config.name, false)
                                ]!.aggregate.count.toString()
                              ) : (
                                <div className="mt-1 h-5 w-12 animate-pulse rounded-md bg-border" />
                              ),
                          },
                        ]}
                      />
                    }
                  ></Card>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="my-24 px-2 md:px-12">
        {/* <div className="my-12 flex items-center justify-center text-4xl text-light-0">
          How It Works
        </div> */}
        <div className="mx-auto my-24 h-[2px] w-[90%] rounded-lg bg-border"></div>
        <div className="px-10 mb-10">

          <div className="mb-6 flex justify-center px-3 text-center text-4xl text-light-0">
            Renting a Token
          </div>
          <div className="grid w-full grid-cols-1 flex-wrap gap-4  md:grid-cols-3">
            {[
              {
                icon: <RentGlow />,
                header: 'Rent an NFT',
                description:
                  'Browse our various collections and rent an NFT at its specified rate in just a few clicks',
              },
              {
                icon: <MoneyGlow />,
                header: 'Access Utility',
                description:
                  'Given that the actual NFT sits in your wallet while rented, you can access any utility it provides',
              },
              {
                icon: <WalletGlow />,
                header: 'Extend Duration',
                description:
                  "Some rentals are extendable! In many cases, you can optionally pay to extend the rental's duration",
              },
            ].map(({ icon, header, description }) => (
              <div
                key={header}
                className="min-h-80 flex flex-col items-center rounded-3xl bg-white bg-opacity-5 py-12 px-4 xl:px-24"
              >
                <Glow blur={20} scale={3}>
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl p-3"
                    css={css`
                      background: linear-gradient(
                        180deg,
                        rgba(184, 95, 255, 0.25) 0%,
                        rgba(184, 95, 255, 0) 100%
                      );
                      box-shadow: 0px 0px 0px 3px rgba(255, 255, 255, 0.1) inset;
                    `}
                  >
                    {icon}
                  </div>
                </Glow>
                <div className="my-4 text-3xl text-light-0">{header}</div>
                <div className="text-center text-medium-3">{description}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-10">
          <div className="mb-6 mt-20 flex justify-center px-3 text-center text-4xl text-light-0">
            Listing a Token
          </div>
          <div className="grid w-full grid-cols-1 flex-wrap gap-4  md:grid-cols-3">
            {[
              {
                icon: <RentGlowSecondary />,
                header: 'List your NFT',
                description:
                  'Specify a price and rental parameters like expiration, duration or rate and list your NFT for rent',
              },
              {
                icon: <MoneyGlowSecondary />,
                header: 'Earn Passive Income',
                description:
                  'Users can pay to hold your NFT until it is securely returned back to you at the end of the rental period',
              },
              {
                icon: <WalletGlowSecondary />,
                header: 'Automatic Relisting',
                description:
                  'Rentals are automatically relisted by default until a lister-specified max expiration is reached.',
              },
            ].map(({ icon, header, description }) => (
              <div
                key={header}
                className="min-h-80 flex flex-col items-center rounded-3xl bg-white bg-opacity-5 py-12 px-4 xl:px-24"
              >
                <Glow blur={20} scale={3}>
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl p-3"
                    css={css`
                      background: linear-gradient(
                        180deg,
                        rgba(251, 192, 147, 0.25) 0%,
                        rgba(184, 95, 255, 0) 100%
                      );
                      box-shadow: 0px 0px 0px 3px rgba(255, 255, 255, 0.1) inset;
                    `}
                  >
                    {icon}
                  </div>
                </Glow>
                <div className="my-4 text-3xl text-light-0">{header}</div>
                <div className="text-center text-medium-3">{description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <FooterSlim />
    </div>
  )
}
