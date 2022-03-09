import React, { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { DatePicker, Select } from 'antd'
import { Connection, PublicKey } from '@solana/web3.js'
import { Wallet } from '@saberhq/solana-contrib'
import { ButtonWithFooter } from 'rental-components/common/ButtonWithFooter'
import { Alert } from 'rental-components/common/Alert'
import { StepDetail } from 'rental-components/common/StepDetail'
import {
  Fieldset,
  Input,
  InputBorder,
} from 'rental-components/common/LabeledInput'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'
import { FiSend } from 'react-icons/fi'
import { BiTimer, BiQrScan } from 'react-icons/bi'
import { ImPriceTags } from 'react-icons/im'
import { PAYMENT_MINTS } from 'rental-components/common/Constants'
import { MintPriceSelector } from 'rental-components/common/MintPriceSelector'
import { TokenData } from 'api/api'
import { getQueryParam, longDateString } from 'common/utils'
import { NFTOverlay } from 'common/NFTOverlay'
import { claimLinks, rentals } from '@cardinal/token-manager'
import { executeTransaction } from 'common/Transactions'
import { notify } from 'common/Notification'
import { FaLink, FaEye } from 'react-icons/fa'
import { GrReturn } from 'react-icons/gr'
import {
  InvalidationType,
  TokenManagerKind,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import getEditionInfo, { EditionInfo } from 'api/editions'
import { useUserTokenData } from 'providers/TokenDataProvider'
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

export type RentalCardProps = {
  dev?: boolean
  cluster?: string
  connection: Connection
  wallet: Wallet
  tokenData: TokenData
  appName?: string
  appTwitter?: string
  notify?: Function
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
  notify,
  onComplete,
}: RentalCardProps) => {
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const { refreshTokenAccounts } = useUserTokenData()
  const { tokenAccount, metaplexData, metadata, tokenManager } = tokenData
  const customImageUri = getQueryParam(metadata?.data?.image, 'uri')
  const [invalidationType, setInvalidationType] = useState(
    InvalidationType.Return
  )

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

  // form
  const [price, setPrice] = useState(0)
  const [paymentMint, setPaymentMint] = useState(PAYMENT_MINTS[0].mint)
  const [expiration, setExpiration] = useState<number | null>(null)
  const [maxUsages, setMaxUsages] = useState<number | null>(null)
  const [visibility, setVisibiliy] = useState<'private' | 'public'>('public')
  const handleRental = async () => {
    try {
      if (!tokenAccount) {
        throw 'Token acount not found'
      }
      setLoading(true)
      const rentalMint = new PublicKey(
        tokenAccount?.account.data.parsed.info.mint
      )
      const [transaction, tokenManagerId, otpKeypair] =
        await rentals.createRental(connection, wallet, {
          rentalMint,
          paymentAmount: price ?? undefined,
          paymentMint: paymentMint ? new PublicKey(paymentMint) : undefined,
          issuerTokenAccountId: tokenAccount?.pubkey,
          usages: maxUsages || undefined,
          expiration: expiration || undefined,
          kind:
            editionInfo.edition || editionInfo.masterEdition
              ? TokenManagerKind.Edition
              : TokenManagerKind.Managed,
          invalidationType,
          visibility,
        })
      await executeTransaction(connection, wallet, transaction, {
        silent: false,
        callback: refreshTokenAccounts,
      })
      const link = claimLinks.getLink(
        tokenManagerId,
        otpKeypair,
        cluster,
        `${process.env.BASE_URL}/claim`
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
  console.log(paymentMint, price)
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
              usages={maxUsages ? 0 : undefined}
              maxUsages={maxUsages || undefined}
              revocable={tokenManager?.parsed.revokeAuthority != null}
              extendable={tokenManager?.parsed.isExtendable}
              returnable={invalidationType === InvalidationType.Return}
              lineHeight={12}
            />
            {metadata &&
              metadata.data &&
              (metadata.data.animation_url ? (
                // @ts-ignore
                <model-viewer
                  className="media"
                  auto-rotate-delay="0"
                  auto-rotate="true"
                  auto-play="true"
                  src={metadata.data.animation_url}
                  arStatus="not-presenting"
                  // @ts-ignore
                ></model-viewer>
              ) : (
                <img
                  className="media"
                  src={customImageUri || metadata.data.image}
                  alt={metadata.data.name}
                />
              ))}
          </NFTOuter>
          {editionInfo && getEditionPill(editionInfo)}
        </ImageWrapper>
        <DetailsWrapper>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              gap: '2%',
              alignItems: 'flex-start',
            }}
          >
            <StepDetail
              width="49%"
              icon={<BiTimer />}
              title="Duration"
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
            <StepDetail
              width="49%"
              icon={<BiQrScan />}
              title="Uses"
              description={
                <Fieldset>
                  <InputBorder>
                    <Input
                      name="tweet"
                      type="number"
                      onChange={(e) => setMaxUsages(parseInt(e.target.value))}
                    />
                  </InputBorder>
                </Fieldset>
              }
            />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              gap: '2%',
              alignItems: 'flex-start',
            }}
          >
            <StepDetail
              width="49%"
              icon={<ImPriceTags />}
              title="Pricing Details"
              description={
                <>
                  <MintPriceSelector
                    disabled={visibility === 'private'}
                    price={price}
                    mint={paymentMint}
                    handlePrice={setPrice}
                    handleMint={setPaymentMint}
                  />
                </>
              }
            />
            <StepDetail
              width="49%"
              icon={<GrReturn />}
              title="Invalidation"
              description={
                <Select
                  style={{ width: '100%' }}
                  onChange={(e) => setInvalidationType(e)}
                  defaultValue={invalidationType}
                >
                  {[
                    {
                      type: InvalidationType.Return,
                      label: 'Return',
                    },
                    {
                      type: InvalidationType.Invalidate,
                      label: 'Invalidate',
                    },
                  ].map(({ label, type }) => (
                    <Option key={type} value={type}>
                      {label}
                    </Option>
                  ))}
                </Select>
              }
            />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              gap: '2%',
              alignItems: 'flex-start',
            }}
          >
            <StepDetail
              width="49%"
              icon={<FaEye />}
              title="Visibility"
              description={
                <Select
                  style={{ width: '100%' }}
                  onChange={(e) => setVisibiliy(e)}
                  defaultValue={visibility}
                >
                  {[
                    {
                      type: 'public',
                      label: 'Public',
                    },
                    {
                      type: 'private',
                      label: 'Private',
                    },
                  ].map(({ label, type }) => (
                    <Option key={type} value={type}>
                      {label}
                    </Option>
                  ))}
                </Select>
              }
            />
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
                        {maxUsages && expiration
                          ? `for either ${maxUsages} uses or until ${longDateString(
                              expiration
                            )} and then it will be ${
                              invalidationType === InvalidationType.Return
                                ? 'securely returned to you.'
                                : 'invalid forever..'
                            }`
                          : maxUsages
                          ? `for ${maxUsages} uses and then it will be ${
                              invalidationType === InvalidationType.Return
                                ? 'securely returned to you.'
                                : 'invalid forever'
                            }`
                          : expiration
                          ? `until ${longDateString(
                              expiration
                            )} and then it will be ${
                              invalidationType === InvalidationType.Return
                                ? 'securely returned to you.'
                                : 'invalid forever.'
                            }`
                          : 'forever'}
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
              Send {visibility} link
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

const ButtonWrapper = styled.div`
  display: flex;
  margin-top: 5px;
  justify-content: center;
`

const ButtonLight = styled.div`
  border-radius: 5px;
  padding: 5px 8px;
  border: none;
  background: #eee;
  color: #777;
  cursor: pointer;
  transition: 0.1s all;
  &:hover {
    background: #ddd;
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
