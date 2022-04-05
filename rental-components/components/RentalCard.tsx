import type { IssueParameters } from '@cardinal/token-manager'
import { claimLinks, issueToken } from '@cardinal/token-manager'
import {
  InvalidationType,
  TokenManagerKind,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import styled from '@emotion/styled'
import * as anchor from '@project-serum/anchor'
import type { Wallet } from '@saberhq/solana-contrib'
import type { Connection } from '@solana/web3.js'
import { Keypair, PublicKey } from '@solana/web3.js'
import { DatePicker, InputNumber, Select } from 'antd'
import type { TokenData } from 'api/api'
import type { EditionInfo } from 'api/editions'
import getEditionInfo from 'api/editions'
import { tryPublicKey } from 'api/utils'
import { NFTOverlay } from 'common/NFTOverlay'
import { notify } from 'common/Notification'
import { executeTransaction } from 'common/Transactions'
import { fmtMintAmount } from 'common/units'
import { getQueryParam, longDateString, shortPubKey } from 'common/utils'
import { usePaymentMints } from 'providers/PaymentMintsProvider'
import { getLink } from 'providers/ProjectConfigProvider'
import { useUserTokenData } from 'providers/TokenDataProvider'
import React, { useEffect, useState } from 'react'
import { BiQrScan, BiTimer } from 'react-icons/bi'
import { FaEye, FaLink } from 'react-icons/fa'
import { FiSend } from 'react-icons/fi'
import { GiRobotGrab } from 'react-icons/gi'
import { GrReturn } from 'react-icons/gr'
import { ImPriceTags } from 'react-icons/im'
import { Alert } from 'rental-components/common/Alert'
import { Button } from 'rental-components/common/Button'
import { ButtonWithFooter } from 'rental-components/common/ButtonWithFooter'
import { PAYMENT_MINTS } from 'rental-components/common/Constants'
import {
  Fieldset,
  Input,
  InputBorder,
} from 'rental-components/common/LabeledInput'
import { MintPriceSelector } from 'rental-components/common/MintPriceSelector'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'
import { StepDetail } from 'rental-components/common/StepDetail'

const { Option } = Select

const NFTOuter = styled.div`
  margin: 20px auto 0px auto;
  height: 200px;
  position: relative;
  border-radius: 10px;

  .media {
    border-radius: 10px;
    height: 100%;
  }
`

const handleCopy = (shareUrl: string) => {
  navigator.clipboard.writeText(shareUrl)
  notify({ message: 'Share link copied' })
}

function getEditionPill(editionInfo: EditionInfo) {
  const masterEdition = editionInfo.masterEdition
  const edition = editionInfo.edition

  return (
    <div className="ms-2 mx-auto flex justify-center">
      <span className="badge badge-pill bg-dark">{`${
        edition && masterEdition
          ? `Edition ${edition.edition.toNumber()} / ${masterEdition.supply.toNumber()}`
          : masterEdition
          ? 'Master Edition'
          : 'No Master Edition Information'
      }`}</span>
    </div>
  )
}

const formatError = (error: string) => {
  if (error.includes('0x1780')) {
    return 'This mint is not elligible for rent'
  }
  return error
}

const capitalizeFirstLetter = (value: string) => {
  return value[0] ? value[0].toUpperCase() + value.slice(1) : ''
}

export type InvalidatorOption = 'usages' | 'expiration' | 'duration' | 'manual'

const VISIBILITY_OPTIONS = ['public', 'private'] as const
export type VisibilityOption = typeof VISIBILITY_OPTIONS[number]

export type InvalidationTypeOption = 'return' | 'invalidate' | 'release'
const INVALIDATION_TYPES: {
  type: InvalidationType
  label: InvalidationTypeOption
}[] = [
  {
    type: InvalidationType.Return,
    label: 'return',
  },
  {
    type: InvalidationType.Invalidate,
    label: 'invalidate',
  },
  {
    type: InvalidationType.Release,
    label: 'release',
  },
]

export type DurationOption =
  | 'minutes'
  | 'hours'
  | 'days'
  | 'weeks'
  | 'months'
  | 'years'
const DURATION_DATA: { [key in DurationOption]: number } = {
  minutes: 60,
  hours: 3600,
  days: 86400,
  weeks: 604800,
  months: 2592000,
  years: 31104000,
}

export type RentalCardConfig = {
  invalidators: InvalidatorOption[]
  invalidationOptions?: {
    durationOptions: DurationOption[]
    invalidationTypes: InvalidationTypeOption[]
    paymentMints: string[]
    freezeRentalDuration?: {durationDataindex: number, value: string},
    visibilities?: VisibilityOption[]
    setClaimRentalReceipt: boolean
    showClaimRentalReceipt?: boolean
  }
  extensionOptions?: {
    setDisablePartialExtension?: boolean
    showDisablePartialExtension?: boolean
  }
}

export type RentalCardProps = {
  dev?: boolean
  cluster?: string
  connection: Connection
  wallet: Wallet
  tokenData: TokenData
  appName?: string
  appTwitter?: string
  rentalCardConfig: RentalCardConfig
  notify?: () => void
  onComplete?: (asrg0: string) => void
}

export const RentalCard = ({
  appName,
  appTwitter,
  dev,
  cluster,
  connection,
  wallet,
  tokenData,
  rentalCardConfig,
  notify,
  onComplete,
}: RentalCardProps) => {
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const { refreshTokenAccounts } = useUserTokenData()
  const { paymentMintInfos } = usePaymentMints()
  const { tokenAccount, metaplexData, editionData, metadata, tokenManager } =
    tokenData
  const customImageUri = getQueryParam(metadata?.data?.image, 'uri')

  // TODO get this from tokenData
  const [editionInfo, setEditionInfo] = useState<EditionInfo>({})
  const getEdition = async () => {
    try {
      const editionInfo = await getEditionInfo(metaplexData, connection)
      setEditionInfo(editionInfo)
    } catch (e) {
      console.log(e)
    }
  }
  useEffect(() => {
    getEdition()
  }, [metaplexData])

  // Pull overrides from config
  const visibilities =
    rentalCardConfig.invalidationOptions?.visibilities || VISIBILITY_OPTIONS

  const invalidationTypes = rentalCardConfig.invalidationOptions
    ?.invalidationTypes
    ? INVALIDATION_TYPES.filter(({ label }) =>
        rentalCardConfig.invalidationOptions?.invalidationTypes?.includes(label)
      )
    : INVALIDATION_TYPES

  const durationData = rentalCardConfig.invalidationOptions?.durationOptions
    ? Object.keys(DURATION_DATA)
        .filter((key) =>
          rentalCardConfig.invalidationOptions?.durationOptions?.includes(
            key as DurationOption
          )
        )
        .reduce((obj: { [key: string]: number }, key: string) => {
          const d = DURATION_DATA[key as DurationOption]
          if (d) {
            obj[key] = d
          }
          return obj
        }, {})
    : DURATION_DATA

  const paymentMintData = rentalCardConfig.invalidationOptions?.paymentMints
    ? PAYMENT_MINTS.filter(({ mint }) =>
        rentalCardConfig.invalidationOptions?.paymentMints?.includes(mint)
      )
    : PAYMENT_MINTS

  const showClaimRentalReceipt =
    rentalCardConfig.invalidationOptions?.showClaimRentalReceipt

  // defaults
  const defaultVisibility = visibilities[0]
  const defaultDurationOption = Object.keys(durationData)[rentalCardConfig.invalidationOptions?.freezeRentalDuration?.durationDataindex || 2]! as DurationOption
  const defaultPaymentMint = paymentMintData[0]!
  const defaultInvalidationType = invalidationTypes[0]!.type

  // state
  const [price, setPrice] = useState(0)
  const [paymentMint, setPaymentMint] = useState<string>(
    defaultPaymentMint.mint
  )
  const [expiration, setExpiration] = useState<number | null>(null)
  const [durationAmount, setDurationAmount] = useState<number | null>(1)
  const [durationOption, setDurationOption] = useState<DurationOption>(
    defaultDurationOption
  )
  const [extensionPaymentAmount, setExtensionPaymentAmount] = useState(0)
  const [extensionPaymentMint, setExtensionPaymentMint] = useState(
    defaultPaymentMint.mint
  )
  const [extensionDurationAmount, setExtensionDurationAmount] = useState<
    number | null
  >(null)
  const [extensionDurationOption, setExtensionDurationOption] =
    useState<DurationOption>(defaultDurationOption)
  const [extensionMaxExpiration, setExtensionMaxExpiration] = useState<
    number | null
  >(null)
  const [disablePartialExtension, setDisablePartialExtension] = useState<
    boolean | null
  >(null)
  const [totalUsages, setTotalUsages] = useState<number | null>(null)
  const [visibility, setVisibiliy] =
    useState<VisibilityOption>(defaultVisibility)
  const [invalidationType, setInvalidationType] = useState(
    defaultInvalidationType
  )
  const [customInvalidator, setCustomInvalidator] = useState<
    string | undefined
  >(undefined)
  const [claimRentalReceipt, setClaimRentalReceipt] = useState(
    rentalCardConfig.invalidationOptions?.setClaimRentalReceipt || false
  )

  const [selectedInvalidators, setSelectedInvalidators] = useState<
    InvalidatorOption[]
  >(rentalCardConfig.invalidators[0] ? [rentalCardConfig.invalidators[0]] : [])
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false)
  const [showExtendDuration, setShowExtendDuration] = useState(false)

  // reset
  useEffect(() => {
    if (!selectedInvalidators.includes('duration')) {
      setExtensionDurationAmount(null)
      setExtensionDurationOption(defaultDurationOption)
    }
    if (!selectedInvalidators.includes('expiration')) {
      setExpiration(null)
    }
    if (!selectedInvalidators.includes('manual')) {
      setCustomInvalidator(undefined)
    }
    if (!selectedInvalidators.includes('usages')) {
      setTotalUsages(null)
    }
  }, [selectedInvalidators])

  const hasAllExtensionProperties = (): boolean => {
    return extensionPaymentAmount &&
      extensionDurationAmount &&
      extensionPaymentMint &&
      extensionDurationOption
      ? true
      : false
  }

  const handleRental = async () => {
    const extensionPaymentMintPublicKey = tryPublicKey(extensionPaymentMint)
    try {
      if (!tokenAccount) {
        throw 'Token acount not found'
      }
      if (showExtendDuration && !hasAllExtensionProperties()) {
        throw 'Please fill out all extension time and price fields'
      }
      if (!extensionPaymentMintPublicKey) {
        throw 'Invalid payment mint'
      }

      setLoading(true)
      const rentalMint = new PublicKey(
        tokenAccount?.account.data.parsed.info.mint
      )

      const receiptMintKeypair = Keypair.generate()
      const issueParams: IssueParameters = {
        claimPayment:
          price && paymentMint
            ? {
                paymentAmount: price,
                paymentMint: new PublicKey(paymentMint),
              }
            : undefined,
        timeInvalidation:
          expiration || (durationAmount && durationOption)
            ? {
                expiration: expiration || undefined,
                durationSeconds:
                  durationAmount && durationOption
                    ? durationAmount * (durationData[durationOption] || 0)
                    : undefined,
                maxExpiration: extensionMaxExpiration
                  ? extensionMaxExpiration
                  : undefined,
                extension: hasAllExtensionProperties()
                  ? {
                      extensionPaymentAmount: extensionPaymentAmount,
                      extensionDurationSeconds:
                        extensionDurationAmount! *
                        (durationData[extensionDurationOption] || 0),
                      extensionPaymentMint: extensionPaymentMintPublicKey,
                      disablePartialExtension: disablePartialExtension
                        ? disablePartialExtension
                        : undefined,
                    }
                  : undefined,
              }
            : undefined,
        useInvalidation: totalUsages ? { totalUsages: totalUsages } : undefined,
        mint: rentalMint,
        issuerTokenAccountId: tokenAccount?.pubkey,
        kind:
          editionInfo.edition || editionInfo.masterEdition
            ? TokenManagerKind.Edition
            : TokenManagerKind.Managed,
        invalidationType,
        visibility,
        customInvalidators: customInvalidator
          ? [new PublicKey(customInvalidator)]
          : undefined,
        receiptOptions: claimRentalReceipt ? { receiptMintKeypair } : undefined,
      }

      const [transaction, tokenManagerId, otpKeypair] = await issueToken(
        connection,
        wallet,
        issueParams
      )
      await executeTransaction(connection, wallet, transaction, {
        silent: false,
        callback: refreshTokenAccounts,
        signers: claimRentalReceipt ? [receiptMintKeypair] : [],
      })
      const link = claimLinks.getLink(
        tokenManagerId,
        otpKeypair,
        cluster,
        getLink('/claim', false)
      )
      setLink(link)
      handleCopy(link)
      console.log(link)
    } catch (e) {
      console.log('Error handling rental', e)
      setError(`Error handling rental: ${formatError(`${e}`)}`)
    } finally {
      setLoading(false)
    }
  }
  return (
    <RentalCardOuter>
      <Wrapper>
        <Instruction>
          {appName ? `${appName} uses` : 'Use'} Cardinal to rent out this NFT on{' '}
          <strong>Solana</strong>.
        </Instruction>
        {(!wallet?.publicKey || !connection) && (
          <Alert
            style={{ marginBottom: '20px' }}
            message={
              <>
                <div>Connect wallet to continue</div>
              </>
            }
            type="warning"
            showIcon
          />
        )}
        <ImageWrapper>
          <NFTOuter>
            <NFTOverlay
              state={tokenManager?.parsed.state}
              paymentAmount={price || undefined}
              paymentMint={paymentMint || undefined}
              expiration={expiration || undefined}
              durationSeconds={
                durationAmount && durationOption
                  ? durationAmount * (durationData[durationOption] || 0)
                  : undefined
              }
              usages={totalUsages ? 0 : undefined}
              totalUsages={totalUsages || undefined}
              extendable={hasAllExtensionProperties()}
              returnable={invalidationType === InvalidationType.Return}
              revocable={customInvalidator ? true : false}
              lineHeight={12}
            />
            {metadata && metadata.data && (
              // (metadata.data.animation_url ? (
              //   // @ts-ignore
              //   <video
              //     className="media"
              //     auto-rotate-delay="0"
              //     auto-rotate="true"
              //     auto-play="true"
              //     src={metadata.data.animation_url}
              //     // arStatus="not-presenting"
              //     // @ts-ignore
              //   ></video>
              // ) : (
              <img
                className="media"
                src={customImageUri || metadata.data.image}
                alt={metadata.data.name}
              />
            )}
          </NFTOuter>
          {editionInfo && getEditionPill(editionInfo)}
        </ImageWrapper>
        <DetailsWrapper>
          {rentalCardConfig.invalidators.length > 1 && (
            <div className="flex justify-center">
              {rentalCardConfig.invalidators.map(
                (invalidator) =>
                  ({
                    usages: (
                      <div
                        className="mr-4 flex cursor-pointer"
                        onClick={() => {
                          if (selectedInvalidators.includes('usages')) {
                            setSelectedInvalidators(
                              selectedInvalidators.filter((o) => o !== 'usages')
                            )
                          } else {
                            setSelectedInvalidators([
                              ...selectedInvalidators.filter(
                                (o) => o !== 'manual'
                              ),
                              'usages',
                            ])
                          }
                        }}
                      >
                        <input
                          className="my-auto mr-1 cursor-pointer"
                          type="checkbox"
                          checked={selectedInvalidators.includes('usages')}
                        />
                        <span className="">Usages</span>
                      </div>
                    ),
                    expiration: (
                      <div
                        className="mr-4 flex cursor-pointer"
                        onClick={() => {
                          if (selectedInvalidators.includes('expiration')) {
                            setSelectedInvalidators(
                              selectedInvalidators.filter(
                                (o) => o !== 'expiration'
                              )
                            )
                          } else {
                            setSelectedInvalidators([
                              ...selectedInvalidators.filter(
                                (o) => o !== 'manual' && o !== 'duration'
                              ),
                              'expiration',
                            ])
                          }
                        }}
                      >
                        <input
                          className="my-auto mr-1 cursor-pointer"
                          type="checkbox"
                          checked={selectedInvalidators.includes('expiration')}
                        />
                        <span className="">Expiration</span>
                      </div>
                    ),
                    duration: (
                      <div
                        className="mr-4 flex cursor-pointer"
                        onClick={() => {
                          if (selectedInvalidators.includes('duration')) {
                            setSelectedInvalidators(
                              selectedInvalidators.filter(
                                (o) => o !== 'duration'
                              )
                            )
                          } else {
                            setSelectedInvalidators([
                              ...selectedInvalidators.filter(
                                (o) => o !== 'manual' && o !== 'expiration'
                              ),
                              'duration',
                            ])
                          }
                        }}
                      >
                        <input
                          className="my-auto mr-1 cursor-pointer"
                          type="checkbox"
                          checked={selectedInvalidators.includes('duration')}
                        />
                        <span className="">Duration</span>
                      </div>
                    ),
                    manual: (
                      <div
                        className="mr-4 flex cursor-pointer"
                        onClick={() => {
                          if (selectedInvalidators.includes('manual')) {
                            setSelectedInvalidators(
                              selectedInvalidators.filter((o) => o !== 'manual')
                            )
                          } else {
                            setSelectedInvalidators(['manual'])
                          }
                        }}
                      >
                        <input
                          className="my-auto mr-1 cursor-pointer"
                          type="checkbox"
                          checked={selectedInvalidators.includes('manual')}
                        />
                        <span className="">Manual</span>
                      </div>
                    ),
                  }[invalidator])
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {!selectedInvalidators.includes('manual') && (
              <StepDetail
                icon={<ImPriceTags />}
                title="Rental Price"
                description={
                  <MintPriceSelector
                    disabled={visibility === 'private'}
                    price={price}
                    mint={paymentMint}
                    mintDisabled={paymentMintData.length === 1}
                    handlePrice={setPrice}
                    handleMint={setPaymentMint}
                  />
                }
              />
            )}
            {selectedInvalidators.includes('manual') && (
              <StepDetail
                icon={<GiRobotGrab />}
                title="Manual Revocation Pubkey"
                description={
                  <div className="flex">
                    <Fieldset>
                      <InputBorder>
                        <Input
                          className="overflow-ellipsis"
                          name="tweet"
                          value={customInvalidator}
                          placeholder={shortPubKey(wallet.publicKey)}
                          onChange={(e) => setCustomInvalidator(e.target.value)}
                        />
                      </InputBorder>
                    </Fieldset>
                    <Button
                      variant={'primary'}
                      className="ml-2 mt-0.5 inline-block flex-none"
                      onClick={() =>
                        setCustomInvalidator(wallet.publicKey.toString())
                      }
                    >
                      Me
                    </Button>
                  </div>
                }
              />
            )}
            {selectedInvalidators.includes('usages') ? (
              <StepDetail
                icon={<BiQrScan />}
                title="Uses"
                description={
                  <Fieldset>
                    <InputBorder>
                      <Input
                        name="tweet"
                        type="number"
                        onChange={(e) =>
                          setTotalUsages(parseInt(e.target.value))
                        }
                      />
                    </InputBorder>
                  </Fieldset>
                }
              />
            ) : null}
            {selectedInvalidators.includes('expiration') && (
              <StepDetail
                icon={<BiTimer />}
                title="Expiration"
                description={
                  <div>
                    <DatePicker
                      style={{
                        borderRadius: '4px',
                        zIndex: 99999,
                      }}
                      showTime
                      onChange={(e) =>
                        setExpiration(e ? e.valueOf() / 1000 : null)
                      }
                    />
                  </div>
                }
              />
            )}
            {selectedInvalidators.includes('duration') && (
              <StepDetail
                icon={<BiTimer />}
                title="Rental Duration"
                description={
                  <div>
                    <div className="flex gap-3 align-middle ">
                      <InputNumber
                        className="rounded-[4px]"
                        style={{ width: '100%' }}
                        placeholder="# of..."
                        min="0"
                        value = {rentalCardConfig.invalidationOptions?.freezeRentalDuration ? rentalCardConfig.invalidationOptions?.freezeRentalDuration.value : durationAmount?.toString() || '1'}
                        onChange={(e) => setDurationAmount(parseInt(e))}
                        disabled={rentalCardConfig.invalidationOptions?.freezeRentalDuration ? true : false}
                      />
                      <Select
                        className="w-max rounded-[4px]"
                        onChange={(e) => setDurationOption(e)}
                        defaultValue={defaultDurationOption}
                        disabled={rentalCardConfig.invalidationOptions?.freezeRentalDuration ? true : false}
                      >
                        {Object.keys(durationData).map((option) => (
                          <Option key={option} value={option}>
                            {durationAmount && durationAmount === 1
                              ? capitalizeFirstLetter(option).substring(
                                  0,
                                  option.length - 1
                                )
                              : capitalizeFirstLetter(option)}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </div>
                }
              />
            )}
          </div>
          <div>
            {selectedInvalidators.includes('duration') &&
              rentalCardConfig.extensionOptions && (
                <>
                  <button
                    className="mb-2 block text-blue-500"
                    onClick={() => setShowExtendDuration(!showExtendDuration)}
                  >
                    {showExtendDuration ? '[-]' : '[+]'} Extendability
                  </button>
                  {showExtendDuration && (
                    <div className="grid grid-cols-2 gap-4 py-2">
                      <StepDetail
                        icon={<ImPriceTags />}
                        title="Extension Price"
                        description={
                          <>
                            <MintPriceSelector
                              disabled={visibility === 'private'}
                              price={extensionPaymentAmount}
                              mint={extensionPaymentMint}
                              mintDisabled={paymentMintData.length === 1}
                              handlePrice={setExtensionPaymentAmount}
                              handleMint={setExtensionPaymentMint}
                            />
                          </>
                        }
                      />
                      <StepDetail
                        icon={<BiTimer />}
                        title="Extension Duration"
                        description={
                          <div>
                            <div className="flex gap-3 align-middle ">
                              <InputNumber
                                className="rounded-[4px]"
                                style={{ width: '100%' }}
                                placeholder="# of..."
                                min="0"
                                step={1}
                                onChange={(e) =>
                                  setExtensionDurationAmount(parseInt(e))
                                }
                              />
                              <Select
                                className="w-max rounded-[4px]"
                                onChange={(e) => setExtensionDurationOption(e)}
                                defaultValue={defaultDurationOption}
                              >
                                {Object.keys(durationData).map((option) => (
                                  <Option key={option} value={option}>
                                    {durationAmount && durationAmount === 1
                                      ? capitalizeFirstLetter(option).substring(
                                          0,
                                          option.length - 1
                                        )
                                      : capitalizeFirstLetter(option)}
                                  </Option>
                                ))}
                              </Select>
                            </div>
                          </div>
                        }
                      />
                      <StepDetail
                        icon={<BiTimer />}
                        title="Max Expiration"
                        description={
                          <div>
                            <DatePicker
                              className="rounded-[4px]"
                              style={{
                                zIndex: 99999,
                              }}
                              showTime
                              onChange={(e) =>
                                setExtensionMaxExpiration(
                                  e ? e.valueOf() / 1000 : null
                                )
                              }
                            />
                          </div>
                        }
                      />
                      {rentalCardConfig.extensionOptions
                        ?.showDisablePartialExtension && (
                        <div className="mt-1">
                          <span
                            className="cursor-pointer"
                            onClick={() =>
                              setDisablePartialExtension(
                                !disablePartialExtension
                              )
                            }
                          >
                            <input
                              className="my-auto inline-block cursor-pointer"
                              type="checkbox"
                              checked={disablePartialExtension || false}
                            />
                            <p className="mb-1 ml-3 inline-block text-[14px] font-bold text-black">
                              Disable Partial Extension
                            </p>
                          </span>
                          <p className="mb-2 ml-6 inline-block text-[12px] text-gray-700">
                            If selected, rental extensions must occur in
                            multiples of the extension duration.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            {(invalidationTypes.length > 1 ||
              visibilities.length > 1 ||
              showClaimRentalReceipt) && (
              <>
                <button
                  className="mb-2 block text-blue-500"
                  onClick={() =>
                    setShowAdditionalOptions(!showAdditionalOptions)
                  }
                >
                  {showAdditionalOptions ? '[-]' : '[+]'} Additional Options
                </button>
                {showAdditionalOptions && (
                  <div className="grid grid-cols-2 gap-4 py-2">
                    {invalidationTypes.length > 1 && (
                      <StepDetail
                        icon={<GrReturn />}
                        title="Invalidation"
                        description={
                          <Select
                            disabled={invalidationTypes.length === 1}
                            style={{ width: '100%' }}
                            onChange={(e) => setInvalidationType(e)}
                            defaultValue={invalidationType}
                          >
                            {invalidationTypes.map(({ label, type }) => (
                              <Option key={type} value={type}>
                                {capitalizeFirstLetter(label)}
                              </Option>
                            ))}
                          </Select>
                        }
                      />
                    )}
                    {visibilities.length > 1 && (
                      <StepDetail
                        icon={<FaEye />}
                        title="Visibility"
                        description={
                          <Select
                            style={{ width: '100%' }}
                            onChange={(v) => {
                              setVisibiliy(v)
                              if (v === 'private') setPrice(0)
                            }}
                            defaultValue={visibility}
                          >
                            {visibilities.map((value) => (
                              <Option key={value} value={value}>
                                {capitalizeFirstLetter(value)}
                              </Option>
                            ))}
                          </Select>
                        }
                      />
                    )}
                    {showClaimRentalReceipt && (
                      <div className="mt-1">
                        <span
                          className="cursor-pointer"
                          onClick={() =>
                            setClaimRentalReceipt(!claimRentalReceipt)
                          }
                        >
                          <input
                            className="my-auto inline-block cursor-pointer"
                            type="checkbox"
                            checked={claimRentalReceipt}
                          />
                          <p className="mb-1 ml-3 inline-block text-[14px] font-bold text-black">
                            Claim Rental Receipt
                          </p>
                        </span>
                        <p className="mb-2 ml-6 inline-block text-[12px] text-gray-700">
                          If selected, a receipt mint will be generated for the
                          rental. The owner of the receipt mint will act as the
                          issuer.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </DetailsWrapper>
        <ButtonWithFooter
          loading={loading}
          complete={false}
          message={
            link ? (
              <StyledAlert>
                <Alert
                  style={{
                    height: 'auto',
                    cursor: 'pointer',
                  }}
                  message={
                    <>
                      <div>
                        Link created {link.substring(0, 20)}
                        ...
                        {link.substring(link.length - 5)}
                        <div>
                          This link can only be used once and cannot be
                          regenerated
                        </div>
                      </div>
                    </>
                  }
                  type="success"
                  showIcon
                />
              </StyledAlert>
            ) : error ? (
              <StyledAlert>
                <Alert
                  style={{ height: 'auto' }}
                  message={
                    <>
                      <div>{error}</div>
                    </>
                  }
                  type="error"
                  showIcon
                />
              </StyledAlert>
            ) : (
              <StyledAlert>
                <Alert
                  style={{ height: 'auto' }}
                  message={
                    <>
                      <div>
                        Whoever claims this rental will own the asset{' '}
                        {totalUsages && expiration
                          ? `for either ${totalUsages} uses or until ${longDateString(
                              expiration
                            )} and then it will be ${
                              invalidationType === InvalidationType.Return
                                ? 'securely returned to you.'
                                : invalidationType === InvalidationType.Release
                                ? 'released to whoever claims it.'
                                : 'invalid forever..'
                            }`
                          : totalUsages
                          ? `for ${totalUsages} uses and then it will be ${
                              invalidationType === InvalidationType.Return
                                ? 'securely returned to you.'
                                : invalidationType === InvalidationType.Release
                                ? 'released to whoever claims it.'
                                : 'invalid forever'
                            }`
                          : expiration
                          ? `until ${longDateString(
                              expiration
                            )} and then it will be ${
                              invalidationType === InvalidationType.Return
                                ? 'securely returned to you.'
                                : invalidationType === InvalidationType.Release
                                ? 'released to whoever claims it.'
                                : 'invalid forever.'
                            }`
                          : durationAmount && durationOption
                          ? `
                            for ${durationAmount} ${
                              durationAmount !== 1
                                ? durationOption.toLocaleLowerCase()
                                : durationOption
                                    .toLocaleLowerCase()
                                    .substring(0, durationOption.length - 1)
                            } and then it will be ${
                              invalidationType === InvalidationType.Return
                                ? 'securely returned to you.'
                                : invalidationType === InvalidationType.Release
                                ? 'released to whoever claims it.'
                                : 'invalid forever.'
                            }`
                          : 'forever.'}
                        {showExtendDuration &&
                        extensionPaymentAmount &&
                        extensionDurationAmount &&
                        extensionPaymentMint
                          ? ` The claimer can choose to extend the rental at the rate of ${fmtMintAmount(
                              paymentMintInfos[extensionPaymentMint.toString()],
                              new anchor.BN(extensionPaymentAmount)
                            )} ${
                              paymentMintData.find(
                                (obj) => obj.mint === extensionPaymentMint
                              )?.symbol
                            } / ${extensionDurationAmount} ${
                              extensionDurationAmount === 1
                                ? extensionDurationOption
                                    ?.toLowerCase()
                                    .substring(
                                      0,
                                      extensionDurationOption.length - 1
                                    )
                                : extensionDurationOption?.toLowerCase()
                            }${
                              extensionMaxExpiration
                                ? ` up until ${new Date(
                                    extensionMaxExpiration * 1000
                                  ).toLocaleString('en-US')}.`
                                : '.'
                            } `
                          : null}
                      </div>
                    </>
                  }
                  type="info"
                  showIcon
                />
              </StyledAlert>
            )
          }
          onClick={link ? () => handleCopy(link) : handleRental}
          footer={<PoweredByFooter />}
        >
          {link ? (
            <div
              style={{ gap: '5px', fontWeight: '300' }}
              className="flex items-center justify-center"
            >
              <FaLink />
              {link.substring(0, 40)}
              ...
              {link.substring(link.length - 10)}
            </div>
          ) : (
            <div
              style={{ gap: '5px' }}
              className="flex items-center justify-center"
            >
              {visibility === 'private' ? 'Get private link' : 'List for rent'}
              <FiSend />
            </div>
          )}
        </ButtonWithFooter>
      </Wrapper>
    </RentalCardOuter>
  )
}

const BigIcon = styled.div<{ selected: boolean }>`
  font-size: 50px;
  background-color: ${({ selected }) => (selected ? 'black' : '#888')};
  color: white;
  padding: 10px;
  cursor: pointer;
  transition: transform 0.2s;
  height: 50px;
  width: 50px;
  display: flex;
  margin: 20px auto 0px auto;
  border-radius: 50%;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.05);
  }
`

const StyledAlert = styled.div`
  width: 100%;
`

const Wrapper = styled.div`
  padding: 10px 28px 28px 28px;
`

const Instruction = styled.h2`
  margin-top: 0px;
  font-weight: normal;
  font-size: 24px;
  line-height: 30px;
  text-align: center;
  letter-spacing: -0.02em;
  color: #000000;
`

const DetailsWrapper = styled.div`
  display: grid;
  grid-row-gap: 28px;
`

const ImageWrapper = styled.div`
  display: grid;
  grid-row-gap: 10px;
  margin-bottom: 20px;
`

export const RentalCardOuter = styled.div``
