import { DisplayAddress } from '@cardinal/namespaces-components'
import { invalidate, withClaimToken } from '@cardinal/token-manager'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import styled from '@emotion/styled'
import { BN } from '@project-serum/anchor'
import type * as splToken from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { Select, Slider } from 'antd'
import type { TokenData } from 'api/api'
import { withWrapSol } from 'api/wrappedSol'
import { BigNumber } from 'bignumber.js'
import { Header } from 'common/Header'
import { NFT, NFTPlaceholder, TokensOuter } from 'common/NFT'
import { notify } from 'common/Notification'
import { Tag } from 'common/Tags'
import { executeTransaction } from 'common/Transactions'
import { fmtMintAmount, getMintDecimalAmount } from 'common/units'
import { getAllAttributes, secondsToString } from 'common/utils'
import { asWallet } from 'common/Wallets'
import { useFilteredTokenManagers } from 'hooks/useFilteredTokenManagers'
import { useProjectStats } from 'hooks/useProjectStatsHook'
import { lighten } from 'polished'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import {
  PAYMENT_MINTS,
  usePaymentMints,
  WRAPPED_SOL_MINT,
} from 'providers/PaymentMintsProvider'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import React, { useState } from 'react'
import { FaLink } from 'react-icons/fa'
import { AsyncButton } from 'rental-components/common/Button'
import { DURATION_DATA } from 'rental-components/components/RentalCard'
import { useRentalRateModal } from 'rental-components/RentalRateModalProvider'

const { Option } = Select

export const handleCopy = (shareUrl: string) => {
  navigator.clipboard.writeText(shareUrl)
  notify({
    message: 'Share link copied',
    description: 'Paste this link from your clipboard',
  })
}

enum OrderCategories {
  RecentlyListed = 'Recently Listed',
  PriceLowToHigh = 'Price: Low to High',
  PriceHighToLow = 'Price: High to Low',
  RateLowToHigh = 'Rate: Low to High',
  RateHighToLow = 'Rate: High to Low',
  DurationLowToHigh = 'Duration: Low to High',
  DurationHighToLow = 'Duration: High to Low',
}

const allOrderCategories = [
  OrderCategories.RecentlyListed,
  OrderCategories.PriceLowToHigh,
  OrderCategories.PriceHighToLow,
  OrderCategories.RateLowToHigh,
  OrderCategories.RateHighToLow,
  OrderCategories.DurationLowToHigh,
  OrderCategories.DurationHighToLow,
]

const boundsToSeconds: { [key in number]: number } = {
  0: 0,
  20: 3600,
  40: 86400,
  60: 604800,
  80: 2419200,
  100: Infinity,
}

export const getTokenMaxDuration = (tokenData: TokenData) => {
  if (tokenData.timeInvalidator?.parsed.maxExpiration) {
    const maxDuration =
      tokenData.timeInvalidator?.parsed.maxExpiration?.toNumber() -
      Date.now() / 1000
    return {
      value: maxDuration,
      displayText: secondsToString(maxDuration, false),
    }
  } else {
    return { value: Infinity, displayText: '∞' }
  }
}

export const getDurationText = (tokenData: TokenData) => {
  return tokenData.timeInvalidator?.parsed ? (
    <div className="float-left">
      {tokenData.timeInvalidator?.parsed.maxExpiration ? (
        <p
          className={`float-left inline-block text-ellipsis whitespace-nowrap`}
        >
          Max Duration: <b>{getTokenMaxDuration(tokenData).displayText}</b>
        </p>
      ) : (
        <p className="float-left inline-block text-ellipsis whitespace-nowrap">
          Fixed Duration:{' '}
          <b>
            {tokenData.timeInvalidator?.parsed.durationSeconds
              ? secondsToString(
                  tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber(),
                  false
                )
              : tokenData.timeInvalidator?.parsed.expiration
              ? secondsToString(
                  tokenData.timeInvalidator?.parsed.expiration?.toNumber() -
                    Date.now() / 1000,
                  false
                )
              : null}
          </b>
        </p>
      )}
    </div>
  ) : null
}

export const Browse = () => {
  const { connection, environment } = useEnvironmentCtx()
  const wallet = useWallet()
  const { config } = useProjectConfig()
  const tokenManagers = useFilteredTokenManagers()
  const tokenManagersForConfig = tokenManagers.data || []
  const projectStats = useProjectStats()

  const [userPaymentTokenAccount, _setUserPaymentTokenAccount] =
    useState<splToken.AccountInfo | null>(null)
  const { paymentMintInfos } = usePaymentMints()
  const [selectedOrderCategory, setSelectedOrderCategory] =
    useState<OrderCategories>(OrderCategories.RateLowToHigh)
  const [selectedFilters, setSelectedFilters] = useState<{
    [filterName: string]: any[]
  }>({})
  const [showFilters, setShowFilters] = useState<boolean>(true)
  const [maxDurationBounds, setMaxDurationBounds] = useState<[number, number]>([
    0,
    Infinity,
  ])
  const rentalRateModal = useRentalRateModal()
  const currentTime = Date.now() / 1000

  const globalRate = DURATION_DATA[config.marketplaceRate ?? 'days']

  const StyledSelect = styled.div`
    .ant-select-selector {
      height: 40px;
      min-width: 180px;
      border: 1px solid ${lighten(0.3, config.colors.main)} !important;
      background-color: ${lighten(0.07, config.colors.main)} !important;
      color: #ffffff !important;
    }
    .ant-select-arrow {
      color: #ffffff !important;
    }
  `

  const StyledSelectMultiple = styled.div`
    .ant-select-selector {
      min-width: 180px;
      border: 1px solid ${lighten(0.3, config.colors.main)} !important;
      background-color: ${lighten(0.07, config.colors.main)} !important;
      color: ${config.colors.secondary} !important;
    }

    .ant-select-selection-item {
      background-color: ${lighten(0.07, config.colors.main)} !important;
      border: 1px solid ${lighten(0.3, config.colors.main)} !important;
    }

    .ant-select-selection-item-remove {
      color: ${lighten(0.1, config.colors.secondary)} !important;
      margin-top: -2px;
      margin-left: 3px;
    }

    .ant-select-arrow {
      color: ${config.colors.secondary} !important;
    }

    .ant-select-clear {
      background: none;
    }
  `

  const getPriceFromTokenData = (tokenData: TokenData) => {
    if (
      tokenData.claimApprover?.parsed &&
      tokenData.claimApprover?.parsed?.paymentMint.toString()
    ) {
      const mintInfo =
        paymentMintInfos[
          tokenData.claimApprover?.parsed?.paymentMint.toString()
        ]
      if (mintInfo) {
        return getMintDecimalAmount(
          mintInfo,
          tokenData.claimApprover?.parsed?.paymentAmount
        )
      } else {
        return new BigNumber(0)
      }
    } else {
      return new BigNumber(0)
    }
  }

  const getSymbolFromTokenData = (tokenData: TokenData) => {
    const symbol = PAYMENT_MINTS.find(
      (mint) =>
        mint.mint === tokenData.claimApprover?.parsed?.paymentMint.toString()
    )?.symbol
    if (!symbol || symbol === 'SOL') {
      return '◎'
    } else {
      return symbol
    }
  }

  function getTokenRentalRate(tokenData: TokenData) {
    const rateOption = config.marketplaceRate ?? 'weeks'
    const rateSeconds = new BN(DURATION_DATA[rateOption])
    const {
      extensionPaymentAmount,
      extensionPaymentMint,
      extensionDurationSeconds,
    } = tokenData.timeInvalidator?.parsed || {
      extensionPaymentAmount: null,
      extensionPaymentMint: null,
      extensionDurationOption: null,
    }

    if (
      !extensionPaymentAmount ||
      !extensionPaymentMint ||
      !extensionDurationSeconds
    ) {
      return null
    }

    const marketplaceRate =
      (extensionPaymentAmount.toNumber() /
        extensionDurationSeconds.toNumber()) *
      rateSeconds.toNumber()

    try {
      return {
        rate: parseFloat(
          fmtMintAmount(
            paymentMintInfos[extensionPaymentMint.toString()],
            new BN(marketplaceRate)
          )
        ),
        displayText: `${fmtMintAmount(
          paymentMintInfos[extensionPaymentMint.toString()],
          new BN(marketplaceRate)
        )} ${getSymbolFromTokenData(tokenData)} / ${rateOption?.substring(
          0,
          rateOption.length - 1
        )}`,
      }
    } catch (e) {
      return null
    }
  }

  const getPriceOrRentalRate = (
    tokenData: TokenData,
    rate: number = globalRate
  ) => {
    let price: BigNumber | undefined = new BigNumber(0)
    if (tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber() === 0) {
      return getTokenRentalRate(tokenData)?.rate ?? 0
    } else {
      price = getPriceFromTokenData(tokenData)
      if (price.toNumber() === 0) return 0
      let duration = 0
      if (tokenData.timeInvalidator?.parsed.durationSeconds) {
        duration = tokenData.timeInvalidator.parsed.durationSeconds.toNumber()
      }
      if (tokenData.timeInvalidator?.parsed.expiration) {
        duration =
          tokenData.timeInvalidator.parsed.expiration.toNumber() -
          Date.now() / 1000
      }
      return (price.toNumber() / duration) * rate
    }
  }

  const getRentalDuration = (tokenData: TokenData) => {
    if (tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber() === 0) {
      return getTokenMaxDuration(tokenData).value
    } else if (tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber()) {
      return tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber()
    } else if (tokenData.timeInvalidator?.parsed.expiration?.toNumber()) {
      return (
        tokenData.timeInvalidator?.parsed.expiration?.toNumber() - currentTime
      )
    } else {
      return 0
    }
  }

  const sortTokens = (tokens: TokenData[]): TokenData[] => {
    let sortedTokens
    switch (selectedOrderCategory) {
      case OrderCategories.RecentlyListed:
        sortedTokens = tokens.sort((a, b) => {
          return (
            (a.tokenManager?.parsed.stateChangedAt.toNumber() ?? 0) -
            (b.tokenManager?.parsed.stateChangedAt.toNumber() ?? 0)
          )
        })
        break
      case OrderCategories.PriceLowToHigh:
        sortedTokens = tokens.sort((a, b) => {
          return (
            (a.claimApprover?.parsed.paymentAmount.toNumber() ?? 0) -
            (b.claimApprover?.parsed.paymentAmount.toNumber() ?? 0)
          )
        })
        break
      case OrderCategories.PriceHighToLow:
        sortedTokens = tokens.sort((a, b) => {
          return (
            (b.claimApprover?.parsed.paymentAmount.toNumber() ?? 0) -
            (a.claimApprover?.parsed.paymentAmount.toNumber() ?? 0)
          )
        })
        break
      case OrderCategories.RateLowToHigh:
        sortedTokens = tokens.sort((a, b) => {
          return getPriceOrRentalRate(a) - getPriceOrRentalRate(b)
        })
        break
      case OrderCategories.RateHighToLow:
        sortedTokens = tokens.sort((a, b) => {
          return getPriceOrRentalRate(b) - getPriceOrRentalRate(a)
        })
        break
      case OrderCategories.DurationLowToHigh:
        sortedTokens = tokens.sort((a, b) => {
          return getRentalDuration(a) - getRentalDuration(b)
        })
        break
      case OrderCategories.DurationHighToLow:
        sortedTokens = tokens.sort((a, b) => {
          return getRentalDuration(b) - getRentalDuration(a)
        })
        break
      default:
        return []
    }

    sortedTokens = [
      ...sortedTokens.filter(
        (token) =>
          token.timeInvalidator?.parsed.durationSeconds?.toNumber() === 0
      ),
      ...sortedTokens.filter(
        (token) =>
          token.timeInvalidator?.parsed.durationSeconds?.toNumber() !== 0
      ),
    ]

    return [
      ...sortedTokens.filter(
        (token) =>
          (token?.tokenManager?.parsed.state as TokenManagerState) ===
          TokenManagerState.Issued
      ),
      ...sortedTokens.filter(
        (token) =>
          (token?.tokenManager?.parsed.state as TokenManagerState) !==
          TokenManagerState.Issued
      ),
    ]
  }

  const durationAmount = (token: TokenData) => {
    if (
      token.timeInvalidator?.parsed.durationSeconds?.toNumber() === 0 &&
      token.timeInvalidator?.parsed?.maxExpiration?.toNumber()
    ) {
      return (
        token.timeInvalidator?.parsed?.maxExpiration?.toNumber() - currentTime
      )
    } else if (token.timeInvalidator?.parsed?.expiration?.toNumber()) {
      return token.timeInvalidator?.parsed?.expiration?.toNumber() - currentTime
    } else {
      return token.timeInvalidator?.parsed?.durationSeconds?.toNumber()
    }
  }

  const filterTokensByAttributes = (tokens: TokenData[]): TokenData[] => {
    const durationTokens = tokens.filter(
      (token) =>
        maxDurationBounds[0] <= (durationAmount(token) ?? Infinity) &&
        maxDurationBounds[1] >= (durationAmount(token) ?? Infinity)
    )
    if (Object.keys(selectedFilters).length <= 0) return durationTokens
    const attributeFilteredTokens: TokenData[] = []
    durationTokens.forEach((token) => {
      let addToken = false
      Object.keys(selectedFilters).forEach((filterName) => {
        if (selectedFilters[filterName]!.length > 0) {
          selectedFilters[filterName]!.forEach((val) => {
            if (
              token.metadata?.data.attributes.filter(
                (a: { trait_type: string; value: any }) =>
                  a.trait_type === filterName && a.value === val
              ).length > 0
            ) {
              addToken = true
            }
          })
        }
      })
      if (addToken) {
        attributeFilteredTokens.push(token)
      }
    })
    return attributeFilteredTokens
  }

  const filteredAndSortedTokens: TokenData[] = sortTokens(
    filterTokensByAttributes(tokenManagersForConfig)
  )
  const handleClaim = async (tokenData: TokenData) => {
    try {
      if (!tokenData.tokenManager) throw new Error('No token manager data')
      if (!wallet.publicKey) throw new Error('Wallet not connected')
      // wrap sol if there is payment required
      const transaction = new Transaction()
      if (
        tokenData?.claimApprover?.parsed.paymentAmount &&
        tokenData?.claimApprover?.parsed.paymentMint.toString() ===
          WRAPPED_SOL_MINT.toString() &&
        tokenData?.claimApprover?.parsed.paymentAmount.gt(new BN(0))
      ) {
        const amountToWrap = tokenData?.claimApprover?.parsed.paymentAmount.sub(
          userPaymentTokenAccount?.amount || new BN(0)
        )
        if (amountToWrap.gt(new BN(0))) {
          await withWrapSol(
            transaction,
            connection,
            asWallet(wallet),
            amountToWrap.toNumber()
          )
        }
      }
      console.log('Claiming token manager', tokenData)
      await withClaimToken(
        transaction,
        environment.override
          ? new Connection(environment.override)
          : connection,
        asWallet(wallet),
        tokenData.tokenManager?.pubkey
      )
      await executeTransaction(connection, asWallet(wallet), transaction, {
        confirmOptions: { commitment: 'confirmed', maxRetries: 3 },
        signers: [],
        notificationConfig: {},
      })
    } catch (e: any) {
      notify({
        message: 'Error claiming rental',
        description: e.toString(),
      })
      console.log(e)
    } finally {
      tokenManagers.refresh()
    }
  }

  const calculateFloorPrice = (tokenDatas: TokenData[]): number => {
    const onlyRateTokens = (tokenData: TokenData) => {
      if (config.marketplaceRate) {
        return (
          tokenData.timeInvalidator?.parsed?.durationSeconds?.toNumber() === 0
        )
      } else {
        return false
      }
    }

    const rentalPrices = tokenDatas
      .filter(
        (tokenData) =>
          tokenData.timeInvalidator?.parsed && onlyRateTokens(tokenData)
      )
      .map((tokenData) => {
        let price = new BigNumber(0)
        let duration = 0

        if (tokenData.timeInvalidator?.parsed) {
          if (
            tokenData.timeInvalidator.parsed.durationSeconds?.toNumber() === 0
          ) {
            if (
              tokenData.timeInvalidator.parsed.extensionPaymentAmount &&
              tokenData.timeInvalidator.parsed.extensionDurationSeconds &&
              tokenData.timeInvalidator?.parsed?.extensionPaymentMint
            ) {
              price = getMintDecimalAmount(
                paymentMintInfos[
                  tokenData.timeInvalidator?.parsed?.extensionPaymentMint.toString()
                ]!,
                tokenData.timeInvalidator?.parsed?.extensionPaymentAmount
              )
              duration =
                tokenData.timeInvalidator.parsed.extensionDurationSeconds.toNumber()
            }
          } else {
            if (
              tokenData.claimApprover?.parsed?.paymentMint &&
              paymentMintInfos &&
              paymentMintInfos[
                tokenData.claimApprover?.parsed?.paymentMint.toString()
              ]
            ) {
              price = getPriceFromTokenData(tokenData)
            }
            if (tokenData.timeInvalidator.parsed.durationSeconds) {
              duration =
                tokenData.timeInvalidator.parsed.durationSeconds.toNumber()
            }
            if (tokenData.timeInvalidator.parsed.expiration) {
              duration =
                tokenData.timeInvalidator.parsed.expiration.toNumber() -
                Date.now() / 1000
            }
          }
        }
        return (price.toNumber() / duration) * globalRate
      })
    if (rentalPrices.length === 0) return 0
    return Math.min(...rentalPrices)
  }

  const updateFilters = (traitType: string, value: any[]) => {
    const filters = { ...selectedFilters }
    if (value.length === 0 && traitType in filters) {
      delete filters[traitType]
    } else {
      filters[traitType] = value
    }
    setSelectedFilters(filters)
  }

  const marks = {
    0: {
      style: {
        color: '#fff',
      },
      label: <span>0</span>,
    },
    20: {
      style: {
        color: '#fff',
      },
      label: <span>1h</span>,
    },
    40: {
      style: {
        color: '#fff',
      },
      label: <span>1d</span>,
    },
    60: {
      style: {
        color: '#fff',
      },
      label: <span>1w</span>,
    },
    80: {
      style: {
        color: '#fff',
      },
      label: <span>4w</span>,
    },
    100: {
      style: {
        color: '#fff',
      },
      label: <span>∞</span>,
    },
  }

  const sortedAttributes = getAllAttributes(tokenManagersForConfig ?? [])

  return (
    <>
      <Header
        loading={tokenManagers.loaded && tokenManagers.refreshing}
        tabs={[
          {
            name: 'Wallet',
            anchor: wallet.publicKey?.toBase58() || 'wallet',
            disabled: !wallet.connected,
          },
          {
            name: 'Manage',
            anchor: 'manage',
            disabled: !wallet.connected || config.disableListing,
          },
          { name: 'Browse', anchor: 'browse' },
        ]}
      />
      <div className="container mx-auto pt-4">
        <div className="mb-4 flex h-min w-full justify-center md:flex-row md:justify-center">
          <div className="rounded-m flex h-fit flex-col rounded-lg sm:flex-row">
            <div
              className="d-block mb-2 flex-col py-3 px-5 sm:mb-0"
              style={{ background: lighten(0.07, config.colors.main) }}
            >
              <p className="text-gray-400">
                FLOOR PRICE /{' '}
                {config.marketplaceRate
                  ? config.marketplaceRate
                      .substring(0, config.marketplaceRate.length - 1)
                      .toUpperCase()
                  : 'DAY'}
              </p>
              <h2 className="text-center font-bold text-gray-100">
                {calculateFloorPrice(filteredAndSortedTokens).toFixed(2)}{' '}
                {filteredAndSortedTokens.length > 0
                  ? getSymbolFromTokenData(filteredAndSortedTokens[0]!)
                  : '◎'}
              </h2>
            </div>
            <div
              className="w-[1px]"
              style={{ background: lighten(0.4, config.colors.main) }}
            ></div>
            <div
              className="d-block mb-2 flex-col py-3 px-5 sm:mb-0"
              style={{ background: lighten(0.07, config.colors.main) }}
            >
              <p className="text-gray-400">TOTAL LISTED</p>
              <h2 className="text-center font-bold text-gray-100">
                {filteredAndSortedTokens.length}
              </h2>
            </div>

            {projectStats && (
              <>
                {projectStats.data?.totalRentalCount && (
                  <>
                    <div
                      className="w-[1px]"
                      style={{ background: lighten(0.4, config.colors.main) }}
                    ></div>
                    <div
                      className="d-block flex-col py-3 px-5"
                      style={{ background: lighten(0.07, config.colors.main) }}
                    >
                      <p className="text-gray-400">TOTAL RENTALS (ALL-TIME)</p>
                      <h2 className="text-center font-bold text-gray-100">
                        {projectStats.data?.totalRentalCount}
                      </h2>
                    </div>
                  </>
                )}
                {projectStats.data?.totalRentalDuration && (
                  <>
                    <div
                      className="my-3 w-[1px]"
                      style={{ background: lighten(0.4, config.colors.main) }}
                    ></div>
                    <div className="d-block flex-col py-3 px-5">
                      <p className="text-gray-400">TOTAL DURATION (ALL-TIME)</p>
                      <h2 className="text-center font-bold text-gray-100">
                        {secondsToString(
                          projectStats.data?.totalRentalDuration
                        )}
                      </h2>
                    </div>
                  </>
                )}
                {projectStats.data?.totalRentalDuration && (
                  <>
                    <div
                      className="my-3 w-[1px]"
                      style={{ background: lighten(0.4, config.colors.main) }}
                    ></div>
                    <div className="d-block flex-col py-3 px-5">
                      <p className="text-gray-400">TOTAL VOLUME (ALL-TIME)</p>
                      <h2 className="text-center font-bold text-gray-100">
                        {secondsToString(projectStats.data?.totalRentalVolume)}{' '}
                        ◎
                      </h2>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex justify-center">
          <div className="md:w-1/5"></div>
        </div>
        <div className="flex flex-wrap justify-center gap-5 md:flex-nowrap lg:flex lg:flex-row">
          <div className="flex flex-col gap-5">
            <div
              className="max-h-[70vh] w-[280px] overflow-y-auto rounded-lg py-4 px-8 text-left"
              style={{ background: lighten(0.07, config.colors.main) }}
            >
              <StyledSelect>
                <Select
                  className=" block h-[30px] w-full rounded-[4px] bg-black text-gray-700 lg:mr-20 xl:mr-4"
                  onChange={(e) => {
                    setSelectedOrderCategory(e)
                  }}
                  defaultValue={selectedOrderCategory}
                  dropdownStyle={{
                    backgroundColor: lighten(0.07, config.colors.main),
                  }}
                >
                  {allOrderCategories.map((category) => (
                    <Option
                      className="hover:brightness-125"
                      key={category}
                      value={category}
                      style={{
                        color: '#ffffff',
                        background: lighten(0.07, config.colors.main),
                      }}
                    >
                      {category}
                    </Option>
                  ))}
                </Select>
              </StyledSelect>
            </div>
            <div
              className="max-h-[70vh] w-[280px] overflow-y-auto rounded-lg py-5 px-8 text-left"
              style={{ background: lighten(0.07, config.colors.main) }}
            >
              <div className="text-white">
                <p className="mb-5 text-lg text-gray-300">Duration Range:</p>
                <Slider
                  onChange={(bounds) =>
                    setMaxDurationBounds([
                      boundsToSeconds[bounds[0]]!,
                      boundsToSeconds[bounds[1]]!,
                    ])
                  }
                  trackStyle={[{ backgroundColor: config.colors.secondary }]}
                  handleStyle={[{ borderColor: config.colors.secondary }]}
                  range
                  marks={marks}
                  step={null}
                  defaultValue={[0, 100]}
                />
              </div>

              {!config.browse?.hideFilters && (
                <div className="mx-auto mt-10">
                  <div
                    onClick={() => setShowFilters(!showFilters)}
                    className="my-3 mx-auto text-lg text-gray-300 hover:cursor-pointer hover:text-gray-100"
                  >
                    {showFilters ? 'Filters [-]' : 'Filters [+]'}
                  </div>
                  {showFilters && (
                    <div className="mx-auto flex flex-col">
                      {Object.keys(sortedAttributes).map((traitType) => (
                        <div key={traitType}>
                          {selectedFilters[traitType] !== undefined &&
                            selectedFilters[traitType]!.length > 0 && (
                              <p className="mb-1 text-gray-100">{traitType}</p>
                            )}
                          <StyledSelectMultiple className="mb-5">
                            <Select
                              mode="multiple"
                              dropdownStyle={{
                                backgroundColor: lighten(
                                  0.07,
                                  config.colors.main
                                ),
                              }}
                              allowClear
                              style={{ width: '100%' }}
                              placeholder={traitType}
                              defaultValue={selectedFilters[traitType] ?? []}
                              onChange={(e) => {
                                updateFilters(traitType, e)
                              }}
                            >
                              {sortedAttributes[traitType]!.map((value) => (
                                <Option
                                  key={value}
                                  value={value}
                                  style={{
                                    color: config.colors.secondary,
                                    background: lighten(
                                      0.07,
                                      config.colors.main
                                    ),
                                  }}
                                >
                                  {value}
                                </Option>
                              ))}
                            </Select>
                          </StyledSelectMultiple>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="w-full">
            <TokensOuter>
              {!tokenManagers.loaded ? (
                <>
                  <NFTPlaceholder />
                  <NFTPlaceholder />
                  <NFTPlaceholder />
                  <NFTPlaceholder />
                  <NFTPlaceholder />
                  <NFTPlaceholder />
                </>
              ) : filteredAndSortedTokens &&
                filteredAndSortedTokens.length > 0 ? (
                filteredAndSortedTokens.map((tokenData) => (
                  <div key={tokenData.tokenManager?.pubkey.toString()}>
                    <NFT
                      key={tokenData?.tokenManager?.pubkey.toBase58()}
                      tokenData={tokenData}
                    />
                    {
                      {
                        [TokenManagerState.Initialized]: <>Initiliazed</>,
                        [TokenManagerState.Issued]: (
                          <div
                            style={{
                              background: lighten(0.07, config.colors.main),
                            }}
                            className={`flex min-h-[82px] w-[280px] flex-col rounded-b-md p-3`}
                          >
                            <div
                              className="mb-2 flex w-full cursor-pointer flex-row text-xs font-bold text-white"
                              onClick={() =>
                                handleCopy(
                                  getLink(
                                    `/claim/${tokenData.tokenManager?.pubkey.toBase58()}`
                                  )
                                )
                              }
                            >
                              <p className="flex w-fit overflow-hidden text-ellipsis whitespace-nowrap text-left">
                                {tokenData.metadata?.data?.name}
                              </p>
                              <div className="ml-[6px] mt-[2px] flex w-fit">
                                <FaLink />
                              </div>
                            </div>

                            <div className="flex w-full flex-row justify-between text-xs">
                              {tokenData.timeInvalidator?.parsed ||
                              tokenData.useInvalidator?.parsed ? (
                                <Tag state={TokenManagerState.Issued}>
                                  <div className="flex flex-col">
                                    <div>{getDurationText(tokenData)}</div>
                                    <DisplayAddress
                                      connection={connection}
                                      address={
                                        tokenData.tokenManager?.parsed.issuer ||
                                        undefined
                                      }
                                      height="18px"
                                      width="100px"
                                      dark={true}
                                    />
                                  </div>
                                </Tag>
                              ) : (
                                <div className="my-auto rounded-lg bg-gray-800 px-5 py-2 text-white">
                                  Private
                                </div>
                              )}

                              <AsyncButton
                                bgColor={config.colors.secondary}
                                variant="primary"
                                disabled={!wallet.publicKey}
                                className="my-auto inline-block flex-none text-xs"
                                handleClick={async () => {
                                  if (wallet.publicKey) {
                                    if (
                                      tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber() ===
                                      0
                                    ) {
                                      rentalRateModal.show(
                                        asWallet(wallet),
                                        connection,
                                        environment.label,
                                        tokenData
                                      )
                                    } else {
                                      await handleClaim(tokenData)
                                    }
                                  }
                                }}
                              >
                                {tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber() ===
                                0 ? (
                                  <>
                                    {getTokenRentalRate(tokenData)?.displayText}{' '}
                                  </>
                                ) : (
                                  <>
                                    Claim{' '}
                                    {(tokenData.claimApprover?.parsed?.paymentAmount.toNumber() ??
                                      0) / 1000000000}{' '}
                                    {getSymbolFromTokenData(tokenData)}{' '}
                                  </>
                                )}
                              </AsyncButton>
                            </div>
                          </div>
                        ),
                        [TokenManagerState.Claimed]: (
                          <div
                            style={{
                              background: lighten(0.07, config.colors.main),
                            }}
                            className={`flex min-h-[82px] w-[280px] flex-col rounded-b-md p-3`}
                          >
                            <div
                              className="mb-2 flex w-full cursor-pointer flex-row text-xs font-bold text-white"
                              onClick={() =>
                                handleCopy(
                                  getLink(
                                    `/claim/${tokenData.tokenManager?.pubkey.toBase58()}`
                                  )
                                )
                              }
                            >
                              <p className="flex w-fit overflow-hidden text-ellipsis whitespace-nowrap text-left">
                                {tokenData.metadata?.data?.name}
                              </p>
                              <div className="ml-[6px] mt-[2px] flex w-fit">
                                <span className="flex w-full text-left">
                                  <FaLink />
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-row justify-between text-xs">
                              {tokenData.recipientTokenAccount?.owner && (
                                <Tag state={TokenManagerState.Claimed}>
                                  <div className="flex flex-col">
                                    <div className="flex">
                                      <span className="inline-block">
                                        Claimed by&nbsp;
                                      </span>
                                      <DisplayAddress
                                        style={{
                                          color: '#52c41a !important',
                                          display: 'inline',
                                        }}
                                        connection={connection}
                                        address={
                                          new PublicKey(
                                            tokenData.recipientTokenAccount?.owner
                                          )
                                        }
                                        height="18px"
                                        width="100px"
                                        dark={true}
                                      />
                                    </div>
                                    <div className="flex">
                                      <span className="inline-block">
                                        Issued by&nbsp;
                                      </span>
                                      <DisplayAddress
                                        style={{
                                          color: '#52c41a !important',
                                          display: 'inline',
                                        }}
                                        connection={connection}
                                        address={
                                          tokenData.tokenManager?.parsed.issuer
                                        }
                                        height="18px"
                                        width="100px"
                                        dark={true}
                                      />
                                    </div>
                                  </div>
                                </Tag>
                              )}
                              {((wallet.publicKey &&
                                tokenData?.tokenManager?.parsed.invalidators &&
                                tokenData?.tokenManager?.parsed.invalidators
                                  .map((i: PublicKey) => i.toString())
                                  .includes(wallet.publicKey?.toString())) ||
                                (tokenData.timeInvalidator &&
                                  tokenData.timeInvalidator.parsed.expiration &&
                                  tokenData.timeInvalidator.parsed.expiration.lte(
                                    new BN(Date.now() / 1000)
                                  )) ||
                                (tokenData.useInvalidator &&
                                  tokenData.useInvalidator.parsed.maxUsages &&
                                  tokenData.useInvalidator.parsed.usages.gte(
                                    tokenData.useInvalidator.parsed.maxUsages
                                  ))) && (
                                <AsyncButton
                                  variant="primary"
                                  disabled={!wallet.connected}
                                  handleClick={async () => {
                                    tokenData?.tokenManager &&
                                      executeTransaction(
                                        connection,
                                        asWallet(wallet),
                                        await invalidate(
                                          connection,
                                          asWallet(wallet),
                                          tokenData?.tokenManager?.parsed.mint
                                        ),
                                        {
                                          callback: tokenManagers.refresh,
                                          silent: true,
                                        }
                                      )
                                  }}
                                >
                                  Revoke
                                </AsyncButton>
                              )}
                            </div>
                          </div>
                        ),
                        [TokenManagerState.Invalidated]: (
                          <Tag state={TokenManagerState.Invalidated}>
                            Invalidated
                          </Tag>
                        ),
                      }[
                        tokenData?.tokenManager?.parsed
                          .state as TokenManagerState
                      ]
                    }
                  </div>
                ))
              ) : (
                <div className="white mt-12 flex w-full flex-col items-center justify-center gap-1">
                  <div className="text-gray-500">No rentals to see here...</div>
                </div>
              )}
            </TokensOuter>
          </div>
        </div>
      </div>
    </>
  )
}
