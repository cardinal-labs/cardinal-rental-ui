import { DisplayAddress } from '@cardinal/namespaces-components'
import { invalidate, withClaimToken } from '@cardinal/token-manager'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import styled from '@emotion/styled'
import { BN } from '@project-serum/anchor'
import type * as splToken from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import type { PublicKey } from '@solana/web3.js'
import { Connection, Transaction } from '@solana/web3.js'
import { Select } from 'antd'
import type { TokenData } from 'api/api'
import { withWrapSol } from 'api/wrappedSol'
import { NFT, TokensOuter } from 'common/NFT'
import { NFTPlaceholder } from 'common/NFTPlaceholder'
import { notify } from 'common/Notification'
import { StyledTag, Tag } from 'common/Tags'
import { executeTransaction } from 'common/Transactions'
import { getMintDecimalAmount } from 'common/units'
import { pubKeyUrl, shortPubKey } from 'common/utils'
import { asWallet } from 'common/Wallets'
import type { ProjectConfig } from 'config/config'
import { lighten } from 'polished'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useIssuedTokens } from 'providers/IssuedTokensProvider'
import { useMetadataData } from 'providers/MetadataProvider'
import {
  PAYMENT_MINTS,
  usePaymentMints,
  WRAPPED_SOL_MINT,
} from 'providers/PaymentMintsProvider'
import { getLink } from 'providers/ProjectConfigProvider'
import React, { useState } from 'react'
import { FaLink } from 'react-icons/fa'
import { AsyncButton, Button } from 'rental-components/common/Button'

const { Option } = Select

const handleCopy = (shareUrl: string) => {
  navigator.clipboard.writeText(shareUrl)
  notify({ message: 'Share link copied' })
}

enum OrderCategories {
  RecentlyListed = 'Recently Listed',
  PriceLowToHigh = 'Price: Low to High',
  PriceHighToLow = 'Price: High to Low',
  RateLowToHigh = 'Rate: Low to High',
  RateHighToLow = 'Rate: High to Low',
}

const allOrderCategories = [
  OrderCategories.RecentlyListed,
  OrderCategories.PriceLowToHigh,
  OrderCategories.PriceHighToLow,
  OrderCategories.RateLowToHigh,
  OrderCategories.RateHighToLow,
]

const globalRate = 604800

const getAllAttributes = (tokens: TokenData[]) => {
  const allAttributes: { [traitType: string]: Set<any> } = {}
  tokens.forEach((tokenData) => {
    if (
      tokenData?.metadata?.data?.attributes &&
      tokenData?.metadata?.data?.attributes.length > 0
    ) {
      tokenData?.metadata?.data?.attributes.forEach(
        (attribute: { trait_type: string; value: any }) => {
          if (attribute.trait_type in allAttributes) {
            allAttributes[attribute.trait_type]!.add(attribute.value)
          } else {
            allAttributes[attribute.trait_type] = new Set([attribute.value])
          }
        }
      )
    }
  })

  const sortedAttributes: { [traitType: string]: any[] } = {}
  Object.keys(allAttributes).forEach((traitType) => {
    sortedAttributes[traitType] = Array.from(allAttributes[traitType] ?? [])
  })
  return sortedAttributes
}

export const Browse = ({ config }: { config: ProjectConfig }) => {
  const { connection, environment } = useEnvironmentCtx()
  const wallet = useWallet()

  const { issuedTokens, loaded, refreshIssuedTokens } = useIssuedTokens()
  const [userPaymentTokenAccount, _setUserPaymentTokenAccount] =
    useState<splToken.AccountInfo | null>(null)
  const { paymentMintInfos } = usePaymentMints()
  const [selectedOrderCategory, setSelectedOrderCategory] =
    useState<OrderCategories>(OrderCategories.PriceLowToHigh)
  const [selectedFilters, setSelectedFilters] = useState<{
    [filterName: string]: any[]
  }>({})
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const { metadata, values } = useMetadataData()

  const StyledSelect = styled.div`
    .ant-select-selector {
      height: 40px;
      min-width: 180px;
      border: 1px solid ${lighten(0.3, config.colors.main)} !important;
      background-color: ${lighten(0.1, config.colors.main)} !important;
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
      background-color: ${lighten(0.1, config.colors.main)} !important;
      color: ${config.colors.secondary} !important;
    }

    .ant-select-selection-item {
      background-color: ${lighten(0.1, config.colors.main)} !important;
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
    if (tokenData.claimApprover?.parsed) {
      return getMintDecimalAmount(
        paymentMintInfos[
          tokenData.claimApprover?.parsed?.paymentMint.toString()
        ]!,
        tokenData.claimApprover?.parsed?.paymentAmount
      ).toNumber()
    } else {
      return 0
    }
  }

  const calculateRateFromTokenData = (
    tokenData: TokenData,
    rate: number = globalRate
  ) => {
    const price = getPriceFromTokenData(tokenData)
    if (price === 0) return 0
    let duration = 0
    if (tokenData.timeInvalidator?.parsed.durationSeconds) {
      duration = tokenData.timeInvalidator.parsed.durationSeconds.toNumber()
    }
    if (tokenData.timeInvalidator?.parsed.expiration) {
      duration =
        tokenData.timeInvalidator.parsed.expiration.toNumber() -
        Date.now() / 1000
    }
    return (price / duration) * rate
  }

  const sortTokens = (tokens: TokenData[]): TokenData[] => {
    switch (selectedOrderCategory) {
      case OrderCategories.RecentlyListed:
        return tokens.sort((a, b) => {
          return (
            (a.tokenManager?.parsed.stateChangedAt.toNumber() ?? 0) -
            (b.tokenManager?.parsed.stateChangedAt.toNumber() ?? 0)
          )
        })
      case OrderCategories.PriceLowToHigh:
        return tokens.sort((a, b) => {
          return (
            (a.claimApprover?.parsed.paymentAmount.toNumber() ?? 0) -
            (b.claimApprover?.parsed.paymentAmount.toNumber() ?? 0)
          )
        })
      case OrderCategories.PriceHighToLow:
        return tokens.sort((a, b) => {
          return (
            (b.claimApprover?.parsed.paymentAmount.toNumber() ?? 0) -
            (a.claimApprover?.parsed.paymentAmount.toNumber() ?? 0)
          )
        })
      case OrderCategories.RateLowToHigh:
        return tokens.sort((a, b) => {
          return calculateRateFromTokenData(a) - calculateRateFromTokenData(b)
        })
      case OrderCategories.RateHighToLow:
        return tokens.sort((a, b) => {
          return calculateRateFromTokenData(b) - calculateRateFromTokenData(a)
        })
      default:
        return []
    }
  }

  const filterTokens = (tokens: TokenData[]): TokenData[] => {
    if (Object.keys(selectedFilters).length <= 0) return tokens
    const attributeFilteredTokens: TokenData[] = []
    tokens.forEach((token) => {
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
    filterTokens(issuedTokens)
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
        message: e.toString(),
      })
      console.log(e)
    } finally {
      refreshIssuedTokens()
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

  const calculateFloorPrice = (tokenDatas: TokenData[]): number => {
    const rentalPrices = tokenDatas
      .filter((tokenData) => tokenData.timeInvalidator?.parsed)
      .map((tokenData) => {
        let price = 0,
          duration = 0

        if (tokenData.timeInvalidator?.parsed) {
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
        return (price / duration) * globalRate
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

  const sortedAttributes = getAllAttributes(issuedTokens)
  return (
    <div className="container mx-auto">
      <div className="mb-4 flex h-min flex-wrap justify-center md:justify-between">
        <div className="flex h-fit">
          <div className="d-block flex-col border-2 border-gray-600 py-3 px-5 md:ml-2">
            <p className="text-gray-400">FLOOR PRICE / WEEK</p>
            <h2 className="text-center font-bold text-gray-100">
              {calculateFloorPrice(filteredAndSortedTokens).toFixed(2)}{' '}
              {filteredAndSortedTokens.length > 0
                ? getSymbolFromTokenData(filteredAndSortedTokens[0]!)
                : '◎'}
            </h2>
          </div>
          <div className="d-block flex-col border-2 border-gray-600  py-3 px-5">
            <p className="text-gray-400">TOTAL LISTED</p>
            <h2 className="text-center font-bold text-gray-100">
              {filteredAndSortedTokens.length}
            </h2>
          </div>
        </div>

        {!config.browse?.hideFilters && (
          <div className={' [w-[220px]'}>
            <div
              onClick={() => setShowFilters(!showFilters)}
              className="my-3 text-center text-lg text-gray-300 hover:cursor-pointer hover:text-gray-100"
            >
              {showFilters ? 'Filters [-]' : 'Filters [+]'}
            </div>
            {showFilters && (
              <div className="flex flex-col">
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
                          backgroundColor: lighten(0.1, config.colors.main),
                        }}
                        allowClear
                        style={{ width: '100%', maxWidth: '200px' }}
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
                              background: lighten(0.1, config.colors.main),
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

        <StyledSelect>
          <Select
            className="m-[10px] h-[30px] w-max rounded-[4px] bg-black text-gray-700"
            onChange={(e) => {
              setSelectedOrderCategory(e)
            }}
            defaultValue={selectedOrderCategory}
            dropdownStyle={{
              backgroundColor: lighten(0.1, config.colors.main),
            }}
          >
            {allOrderCategories.map((category) => (
              <Option
                className="hover:brightness-125"
                key={category}
                value={category}
                style={{
                  color: '#ffffff',
                  background: lighten(0.1, config.colors.main),
                }}
              >
                {category}
              </Option>
            ))}
          </Select>
        </StyledSelect>
      </div>
      <TokensOuter>
        {!loaded ? (
          <>
            <NFTPlaceholder />
            <NFTPlaceholder />
            <NFTPlaceholder />
            <NFTPlaceholder />
            <NFTPlaceholder />
            <NFTPlaceholder />
          </>
        ) : filteredAndSortedTokens && filteredAndSortedTokens.length > 0 ? (
          filteredAndSortedTokens.map((tokenData) => (
            <div
              key={tokenData.tokenManager?.pubkey.toString()}
              style={{
                paddingTop: '10px',
                display: 'flex',
                gap: '10px',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <>
                <NFT
                  key={tokenData?.tokenManager?.pubkey.toBase58()}
                  tokenData={tokenData}
                  hideQRCode={true}
                ></NFT>
                {
                  {
                    [TokenManagerState.Initialized]: <>Initiliazed</>,
                    [TokenManagerState.Issued]: (
                      <div className="w-full">
                        <div className="flex w-full justify-between">
                          <StyledTag>
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                width: '100%',
                              }}
                            >
                              <Tag
                                state={TokenManagerState.Issued}
                                color="warning"
                              >
                                <div className="float-left">
                                  <p className="float-left inline-block text-ellipsis whitespace-nowrap">
                                    {new Date(
                                      Number(
                                        tokenData.tokenManager?.parsed.stateChangedAt.toString()
                                      ) * 1000
                                    ).toLocaleString('en-US', {
                                      year: 'numeric',
                                      month: 'numeric',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                  <br />{' '}
                                  <DisplayAddress
                                    connection={connection}
                                    address={
                                      tokenData.tokenManager?.parsed.issuer ||
                                      undefined
                                    }
                                    height="18px"
                                    width="100px"
                                    dark={true}
                                  />{' '}
                                </div>
                              </Tag>
                            </div>
                          </StyledTag>

                          <div className="flex w-max">
                            <AsyncButton
                              bgColor={config.colors.secondary}
                              variant="primary"
                              disabled={!wallet.publicKey}
                              className="mr-1 inline-block flex-none"
                              handleClick={async () => {
                                if (wallet.publicKey) {
                                  await handleClaim(tokenData)
                                }
                              }}
                            >
                              <>
                                Claim{' '}
                                {(tokenData.claimApprover?.parsed?.paymentAmount.toNumber() ??
                                  0) / 1000000000}{' '}
                                {getSymbolFromTokenData(tokenData)}{' '}
                              </>
                            </AsyncButton>
                            <Button
                              variant="tertiary"
                              className="mr-1 inline-block flex-none"
                              onClick={() =>
                                handleCopy(
                                  getLink(
                                    `/claim/${tokenData.tokenManager?.pubkey.toBase58()}`
                                  )
                                )
                              }
                            >
                              <FaLink />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-white">
                          {tokenData.metadata.data.attributes.map(
                            (attr: { trait_type: string; value: any }) => (
                              <div key="giannis">
                                {metadata.some(
                                  (md) =>
                                    md.toLowerCase() ===
                                    attr.trait_type.toLowerCase()
                                ) &&
                                  (values.length === 0 ||
                                    values.some(
                                      (val) =>
                                        val.toLowerCase() ===
                                        attr.value.toLowerCase()
                                    )) &&
                                  `${attr.trait_type}: ${attr.value}`}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ),
                    [TokenManagerState.Claimed]: (
                      <StyledTag>
                        <Tag state={TokenManagerState.Claimed}>
                          Claimed by&nbsp;
                          <a
                            target="_blank"
                            rel="noreferrer"
                            href={pubKeyUrl(
                              tokenData.recipientTokenAccount?.owner,
                              environment.label
                            )}
                          >
                            {shortPubKey(
                              tokenData.recipientTokenAccount?.owner || ''
                            )}
                          </a>{' '}
                          {/* {shortDateString(
                          tokenData.tokenManager?.parsed.claimedAt
                        )} */}
                        </Tag>
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
                          <Button
                            variant="primary"
                            disabled={!wallet.connected}
                            onClick={async () => {
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
                                    callback: refreshIssuedTokens,
                                    silent: true,
                                  }
                                )
                            }}
                          >
                            Revoke
                          </Button>
                        )}
                      </StyledTag>
                    ),
                    [TokenManagerState.Invalidated]: (
                      <Tag state={TokenManagerState.Invalidated}>
                        Invalidated
                        {/* {shortDateString(
                    tokenData.tokenManager?.parsed.claimedAt
                  )} */}
                      </Tag>
                    ),
                  }[tokenData?.tokenManager?.parsed.state as TokenManagerState]
                }
              </>
            </div>
          ))
        ) : (
          <div className="white flex w-full flex-col items-center justify-center gap-1">
            <div className="text-gray-200">No outstanding tokens!</div>
          </div>
        )}
      </TokensOuter>
    </div>
  )
}
