import { capitalizeFirstLetter } from '@cardinal/common'
import { InvalidationType } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { css } from '@emotion/react'
import { Switch } from 'common/Switch'
import { Toggle } from 'common/Toggle'
import { useWalletId } from 'hooks/useWalletId'
import { useEffect, useState } from 'react'
import type { RentalCardConfig } from 'rental-components/components/RentalIssueCard'

export const VISIBILITY_OPTIONS = ['public', 'private'] as const
export type VisibilityOption = typeof VISIBILITY_OPTIONS[number]

export type InvalidationTypeOption =
  | 'return'
  | 'invalidate'
  | 'release'
  | 'reissue'
export const INVALIDATION_TYPES: {
  type: InvalidationType
  label: InvalidationTypeOption
}[] = [
  {
    type: InvalidationType.Return,
    label: 'return',
  },
  // {
  //   type: InvalidationType.Invalidate,
  //   label: 'invalidate',
  // },
  {
    type: InvalidationType.Release,
    label: 'release',
  },
  {
    type: InvalidationType.Reissue,
    label: 'reissue',
  },
]

export type RentalIssueAdvancedValues = {
  visibility: VisibilityOption
  invalidationType: InvalidationType
}

export type RentalIssueAdvancedProps = {
  showAdvanced: boolean
  rentalCardConfig: RentalCardConfig
  onChange?: (values: RentalIssueAdvancedValues) => void
}

export const RentalIssueAdvanced = ({
  showAdvanced,
  rentalCardConfig,
  onChange,
}: RentalIssueAdvancedProps) => {
  const walletId = useWalletId()

  // Pull overrides from config
  const visibilities =
    rentalCardConfig.invalidationOptions?.visibilities || VISIBILITY_OPTIONS
  const invalidationTypes =
    rentalCardConfig.invalidationOptions?.customInvalidationTypes &&
    walletId &&
    walletId.toString() in
      rentalCardConfig.invalidationOptions.customInvalidationTypes
      ? INVALIDATION_TYPES.filter(({ label }) =>
          rentalCardConfig.invalidationOptions?.customInvalidationTypes?.[
            walletId.toString()
          ]?.includes(label)
        )
      : rentalCardConfig.invalidationOptions?.invalidationTypes
      ? INVALIDATION_TYPES.filter(({ label }) =>
          rentalCardConfig.invalidationOptions?.invalidationTypes?.includes(
            label
          )
        )
      : INVALIDATION_TYPES

  // defaults
  const [visibility, setVisibiliy] = useState<VisibilityOption>(visibilities[0])
  const [invalidationType, setInvalidationType] = useState(
    invalidationTypes[0]!.type
  )

  useEffect(() => {
    onChange &&
      onChange({
        visibility,
        invalidationType,
      })
  }, [visibility, invalidationType])

  return (
    <div
      className={`flex overflow-hidden rounded-xl border-[1px] border-primary-hover bg-primary-light transition-all ${
        showAdvanced ? 'mb-0 h-auto opacity-100' : '-mb-4 h-0 opacity-0'
      }`}
    >
      {invalidationTypes.length > 1 && (
        <div
          className="flex w-1/2 flex-col gap-3 border-r-[2px] p-5"
          css={css`
            border-color: rgba(200, 138, 244, 0.12);
          `}
        >
          <div className="text-base text-light-0">Recurring Listing:</div>
          <div>
            {invalidationTypes.length === 2 &&
            invalidationTypes
              .map((v) => v.type)
              .includes(InvalidationType.Reissue) &&
            invalidationTypes
              .map((v) => v.type)
              .includes(InvalidationType.Return) ? (
              <Toggle
                defaultValue={invalidationType === InvalidationType.Reissue}
                onChange={(v) =>
                  setInvalidationType(
                    v ? InvalidationType.Reissue : InvalidationType.Return
                  )
                }
              />
            ) : (
              <Switch<InvalidationType>
                defaultOption={{
                  value: invalidationType,
                  label: INVALIDATION_TYPES.find(
                    (v) => v.type === invalidationType
                  )?.label,
                }}
                onChange={(v) => setInvalidationType(v.value)}
                options={invalidationTypes.map(({ label, type }) => ({
                  label: capitalizeFirstLetter(label),
                  value: type,
                }))}
              />
            )}
          </div>
          <div>
            {
              {
                [InvalidationType.Reissue]:
                  'After the rental expiration this NFT will be automatically relisted on the Marketplace.',
                [InvalidationType.Return]:
                  'Upon the rental expiration this NFT will be securely returned into your wallet.',
                [InvalidationType.Release]:
                  'Upon the rental expiration this NFT will be released to the current renter to own.',
                [InvalidationType.Invalidate]:
                  'Upon the rental expiration this NFT will be marked as invalid forever.',
              }[invalidationType]
            }
          </div>
        </div>
      )}
      {visibilities.length > 1 && (
        <div className="flex w-1/2 flex-col gap-3 p-5">
          <div className="text-base text-light-0">Visibility:</div>
          <div>
            <Switch<VisibilityOption>
              defaultOption={{
                value: visibility,
                label: capitalizeFirstLetter(visibility),
              }}
              onChange={(v) => setVisibiliy(v.value)}
              options={visibilities.map((value) => ({
                label: capitalizeFirstLetter(value),
                value: value,
              }))}
            />
          </div>
          <div>
            {visibility === 'private'
              ? 'You will receive a private claim link.'
              : 'Your NFT listing will be available to everyone.'}
          </div>
        </div>
      )}
    </div>
  )
}
