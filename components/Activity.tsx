import { tryPublicKey } from '@cardinal/common'
import { DisplayAddress } from '@cardinal/namespaces-components'
import { GlyphLargeClose } from 'assets/GlyphLargeClose'
import { useClaimEventsForConfig } from 'hooks/useClaimEventsForConfig'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

export const Activity = () => {
  const { config } = useProjectConfig()
  const claimEvents = useClaimEventsForConfig()
  const { secondaryConnection } = useEnvironmentCtx()
  return (
    <div className="mx-auto mt-12 px-10">
      <div className="rounded-xl border border-border p-4">
        <div className="flex w-full rounded-xl bg-dark-4 px-8 py-2">
          <div className="flex-1">NFT</div>
          <div className="flex-1">Price</div>
          <div className="flex-1">From</div>
          <div className="flex-1">To</div>
          <div className="flex-1">Transaction</div>
          <div className="flex-1 text-right">Date</div>
        </div>
        {!claimEvents.isFetched ? (
          <div className="flex flex-col gap-4 px-8 py-4">
            <div className="h-8 w-full animate-pulse rounded-lg bg-border"></div>
            <div className="h-8 w-full animate-pulse rounded-lg bg-border"></div>
            <div className="h-8 w-full animate-pulse rounded-lg bg-border"></div>
            <div className="h-8 w-full animate-pulse rounded-lg bg-border"></div>
            <div className="h-8 w-full animate-pulse rounded-lg bg-border"></div>
          </div>
        ) : claimEvents.data && claimEvents.data.length > 0 ? (
          <div className="flex flex-col px-8">
            {claimEvents.data.map((claimEvent) => (
              <div
                className="flex w-full border-b border-border py-4"
                key={`${claimEvent.token_manager_address}-${claimEvent.state_changed_at}`}
              >
                <div className="flex-1">
                  {claimEvent.mint_address_nfts?.name}
                </div>
                <div className="flex-1">10</div>
                <div className="flex-1">
                  <DisplayAddress
                    dark
                    address={tryPublicKey(claimEvent.issuer) ?? undefined}
                    connection={secondaryConnection}
                  />
                </div>
                <div className="flex-1">
                  <DisplayAddress
                    dark
                    address={
                      tryPublicKey(claimEvent.recipient_token_account) ??
                      undefined
                    }
                    connection={secondaryConnection}
                  />
                </div>
                <div className="flex-1">
                  <DisplayAddress
                    dark
                    address={
                      tryPublicKey(claimEvent.token_manager_address) ??
                      undefined
                    }
                    connection={secondaryConnection}
                  />
                </div>
                <div className="flex-1 text-right">
                  {new Date(claimEvent.state_changed_at ?? '').toLocaleString(
                    'en-US',
                    {
                      year: '2-digit',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="my-40 flex w-full flex-col items-center justify-center gap-1">
            <GlyphLargeClose />
            <div className="mt-4 text-medium-4">
              No transactions have been recorded for {config.displayName}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
