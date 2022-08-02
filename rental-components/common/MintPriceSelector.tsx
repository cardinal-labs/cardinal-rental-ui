import { BN } from '@project-serum/anchor'
import { BigNumber } from 'bignumber.js'
import { Selector } from 'common/Selector'
import { PAYMENT_MINTS, usePaymentMints } from 'hooks/usePaymentMints'
import { useEffect, useState } from 'react'

export function tryFormatInput(
  stringAmount: string | undefined,
  decimals: number | undefined,
  defaultValue: string
): string {
  if (!stringAmount) return defaultValue
  const trailingZeros = stringAmount.match(/\.(0+)?$/)
  try {
    if (new BigNumber(stringAmount.replace(',', '')).isFinite()) {
      return new BigNumber(stringAmount.replace(',', ''))
        .shiftedBy(-(decimals || 0))
        .toFormat({
          groupSeparator: '',
          decimalSeparator: '.',
        })
        .concat(trailingZeros && trailingZeros[0] ? trailingZeros[0] : '')
    }
    return defaultValue
  } catch (e) {
    return defaultValue
  }
}

export function tryParseInput(
  stringDecimal: string | undefined,
  decimals: number | undefined,
  defaultValue: string
): string {
  if (!stringDecimal) return '0'
  const trailingZeros = stringDecimal.match(/\.(0+)?$/)
  try {
    if (new BigNumber(stringDecimal.replace(',', '')).isFinite()) {
      return new BigNumber(stringDecimal.replace(',', ''))
        .shiftedBy(decimals || 0)
        .toFixed(0, BigNumber.ROUND_FLOOR)
        .concat(trailingZeros && trailingZeros[0] ? trailingZeros[0] : '')
    }
    return defaultValue
  } catch (e) {
    return defaultValue
  }
}

export const tryBN = (stringAmount: string, defaultValue: BN): BN => {
  try {
    return new BN(stringAmount)
  } catch {}
  return defaultValue
}

export type MintPriceSelectorValue = {
  price: { value: BN; error?: string }
  mint: { value: string; error?: string }
}

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  price?: BN
  defaultPrice?: BN
  defaultMint: string
  paymentMintData: {
    mint: string
    symbol: string
  }[]
  disabled?: boolean
  mintDisabled?: boolean
  handleValue?: (value: MintPriceSelectorValue) => void
}

export const MintPriceSelector: React.FC<Props> = ({
  price,
  defaultPrice,
  defaultMint,
  paymentMintData,
  disabled,
  mintDisabled,
  handleValue,
}: Props) => {
  const [mintValue, setMintValue] = useState(defaultMint)
  const [mintError, setMintError] = useState<string>()

  const paymentMintInfos = usePaymentMints()
  const paymentMintInfo = paymentMintInfos.data
    ? paymentMintInfos.data[mintValue]
    : null

  const [priceError, setPriceError] = useState<string>()
  const [priceInput, setPriceInput] = useState(
    tryParseInput(
      defaultPrice?.toString(),
      paymentMintInfo?.decimals,
      defaultPrice?.toString() ?? ''
    )
  )
  const [priceValue, setPriceValue] = useState(new BN(0))

  useEffect(() => {
    handleValue &&
      handleValue({
        mint: {
          value: mintValue,
          error: mintError,
        },
        price: {
          value: priceValue,
          error: priceError,
        },
      })
  }, [priceValue.toString(), priceError, mintValue, mintError])

  useEffect(() => {
    setPriceValue((v) => tryBN(priceInput, v))
  }, [priceInput])

  useEffect(() => {
    if (price) {
      setPriceInput(price.toString())
    }
  }, [price?.toNumber()])

  return (
    <div className="relative flex w-full items-center gap-2 text-base">
      <input
        className={`w-full rounded-xl border bg-dark-4 py-2 px-3 text-light-0 placeholder-medium-3 outline-none transition-all ${
          disabled ? 'cursor-default opacity-50' : 'cursor-pointer'
        } ${
          priceError
            ? 'border-red-400 focus:border-red-500'
            : 'border-border focus:border-primary'
        }`}
        type="text"
        placeholder={'Price'}
        disabled={disabled}
        value={tryFormatInput(
          priceInput,
          paymentMintInfo?.decimals,
          priceInput ?? ''
        )}
        onChange={(e) => {
          setPriceError(undefined)
          const value = Number(e.target.value)
          if (Number.isNaN(value)) {
            setPriceError('Invalid amount')
            return
          }
          setPriceInput(
            tryParseInput(
              e.target.value,
              paymentMintInfo?.decimals,
              e.target.value ?? ''
            )
          )
        }}
      />
      {paymentMintData.length > 1 ? (
        <Selector<string>
          disabled={mintDisabled}
          defaultOption={{
            value:
              paymentMintData.find((m) => m.mint === defaultMint)?.mint ||
              (paymentMintData[0] || PAYMENT_MINTS[0])!.mint,
            label:
              paymentMintData.find((m) => m.mint === defaultMint)?.symbol ||
              (paymentMintData[0] || PAYMENT_MINTS[0])!.symbol,
          }}
          onChange={(e) => {
            e?.value && setMintValue(e.value)
          }}
          options={(paymentMintData || PAYMENT_MINTS).map(
            ({ mint, symbol }) => ({ label: symbol, value: mint })
          )}
        />
      ) : (
        <div className="absolute right-3">{paymentMintData[0]?.symbol}</div>
      )}
    </div>
  )
}
