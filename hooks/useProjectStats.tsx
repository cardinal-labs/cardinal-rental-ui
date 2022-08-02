import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useQuery } from 'react-query'

export type ProjectStats = {
  totalRentalCount?: number
  totalRentalVolume?: number
  totalRentalDuration?: number
}

export type ClaimEvent = {
  state_changed_at: string
  issuer: string
  mint: string
  time_invalidator_duration_seconds: number
  time_invalidator_expiration: string
  time_invalidator_extension_payment_mint: string
  time_invalidator_extension_payment_amount: number
  time_invalidator_extension_duration_seconds: number
  token_manager_address: string
  paid_claim_approver_payment_amount: number
  paid_claim_approver_payment_mint: string
  mint_address_nfts: {
    name: string
    symbol: string
  }
}

export const useProjectStats = () => {
  const { config } = useProjectConfig()
  const { environment } = useEnvironmentCtx()

  return useQuery<ProjectStats | undefined>(
    ['useProjectStats', environment.index, config.name],
    async () => {
      const index = new ApolloClient({
        uri: 'https://prod-holaplex.hasura.app/v1/graphql',
        cache: new InMemoryCache({ resultCaching: false }),
      })
      if (index && config.filter?.type === 'creators') {
        const collectionClaimEvents = await index.query({
          query: gql`
            query GetCardinalClaimEvents($creators: [String!]) {
              cardinal_claim_events(
                where: {
                  mint_address_nfts: {
                    metadatas_attributes: {
                      first_verified_creator: { _in: $creators }
                    }
                  }
                }
              ) {
                mint_address_nfts {
                  name
                  symbol
                }
                state_changed_at
                issuer
                mint
                time_invalidator_duration_seconds
                time_invalidator_expiration
                time_invalidator_extension_payment_mint
                time_invalidator_extension_payment_amount
                time_invalidator_extension_duration_seconds
                token_manager_address
                paid_claim_approver_payment_amount
                paid_claim_approver_payment_mint
              }
            }
          `,
          variables: {
            creators: config.filter?.value,
          },
        })

        const claimEvents = collectionClaimEvents.data['cardinal_claim_events']

        if (claimEvents.length === 0) {
          return {}
        }

        // const getTotalRentalVolume = () => {
        //   return claimEvents
        //     .map((claimEvent: ClaimEvent) => {
        //       claimEvent.paid_claim_approver_payment_mint &&
        //       claimEvent.paid_claim_approver_payment_amount
        //         ? getMintDecimalAmount(
        //             // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        //             paymentMintInfos[
        //               claimEvent.paid_claim_approver_payment_mint
        //             ]!,
        //             new BN(claimEvent.paid_claim_approver_payment_amount)
        //           ).toNumber()
        //         : claimEvent.time_invalidator_duration_seconds === 0
        //         ? (getMintDecimalAmount(
        //             // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        //             paymentMintInfos[
        //               claimEvent.time_invalidator_extension_payment_mint
        //             ]!,
        //             new BN(claimEvent.time_invalidator_extension_payment_amount)
        //           ).toNumber() *
        //             ((new Date(
        //               claimEvent.time_invalidator_expiration
        //             ).valueOf() -
        //               new Date(claimEvent.state_changed_at).valueOf()) /
        //               1000)) /
        //           claimEvent.time_invalidator_extension_duration_seconds
        //         : 0
        //     })
        //     .reduce((prev: number, curr: number) => prev + curr, 0)
        // }

        // const getTotalRentalDuration = () => {
        //   return claimEvents
        //     .map((claimEvent: ClaimEvent) =>
        //       claimEvent.time_invalidator_expiration
        //         ? (new Date(claimEvent.time_invalidator_expiration).getTime() -
        //             new Date(claimEvent.state_changed_at).getTime()) /
        //           1000
        //         : claimEvent.time_invalidator_duration_seconds
        //         ? claimEvent.time_invalidator_duration_seconds
        //         : 0
        //     )
        //     .reduce((prev: number, curr: number) => prev + curr, 0)
        // }

        const stats = {
          totalRentalCount: claimEvents.length,
          totalRentalVolume: null,
          totalRentalDuration: null,
        }
        return stats
      } else if (!config.filter) {
        const collectionClaimEvents = await index.query({
          query: gql`
            query GetCardinalClaimEvents($creators: [String!]) {
              cardinal_claim_events {
                mint_address_nfts {
                  name
                  symbol
                }
                state_changed_at
                issuer
                mint
                time_invalidator_duration_seconds
                time_invalidator_expiration
                time_invalidator_extension_payment_mint
                time_invalidator_extension_payment_amount
                time_invalidator_extension_duration_seconds
                token_manager_address
                paid_claim_approver_payment_amount
                paid_claim_approver_payment_mint
              }
            }
          `,
        })

        const claimEvents = collectionClaimEvents.data['cardinal_claim_events']

        if (claimEvents.length === 0) {
          return {}
        }
        const stats = {
          totalRentalCount: claimEvents.length,
          totalRentalVolume: null,
          totalRentalDuration: null,
        }
        return stats
      } else {
        return {
          totalRentalCount: null,
          totalRentalVolume: null,
          totalRentalDuration: null,
        }
      }
    },
    {
      refetchOnMount: false,
    }
  )
}
