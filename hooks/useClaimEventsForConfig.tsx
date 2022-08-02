import '@sentry/tracing'

import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import * as Sentry from '@sentry/browser'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useQuery } from 'react-query'

export const ACTIVITY_KEY = 'activity'

export type IndexedClaimEvent = {
  mint?: string
  token_manager_address?: string
  state?: number
  state_changed_at?: number
  issuer?: string
  recipient_token_account?: string
  paid_claim_approver_payment_amount?: number
  mint_address_nfts?: {
    name?: string
    uri?: string
  }
}

export const useClaimEventsForConfig = () => {
  const { config } = useProjectConfig()
  const { environment } = useEnvironmentCtx()
  return useQuery<IndexedClaimEvent[]>(
    [ACTIVITY_KEY, 'useClaimEventsForConfig', config.name],
    async () => {
      const transaction = Sentry.startTransaction({
        name: `[useClaimEventsForConfig] ${config.name}`,
      })
      /////
      const indexer = new ApolloClient({
        uri: environment.index,
        cache: new InMemoryCache({ resultCaching: false }),
      })
      if (
        !(
          (environment.index && config.filter?.type === 'creators') ||
          (config.filter?.type === 'issuer' && !config.indexDisabled)
        )
      ) {
        return []
      }

      const tokenManagerResponse =
        config.filter.type === 'creators'
          ? await indexer.query({
              query: gql`
                query GetActivity(
                  $limit: Int!
                  $offset: Int!
                  $creators: [String!]!
                ) {
                  cardinal_claim_events(
                    limit: $limit
                    offset: $offset
                    where: {
                      mint_address_nfts: {
                        metadatas_metadata_creators: {
                          _and: {
                            creator_address: { _in: $creators }
                            position: { _eq: 0 }
                            _and: { verified: { _eq: true } }
                          }
                        }
                      }
                    }
                  ) {
                    token_manager_address
                    mint
                    state
                    state_changed_at
                    issuer
                    recipient_token_account
                    paid_claim_approver_payment_amount
                    mint_address_nfts {
                      name
                      uri
                    }
                  }
                }
              `,
              variables: {
                creators: config.filter.value,
                limit: 10,
                offset: 0,
              },
            })
          : await indexer.query({
              query: gql`
                query GetActivity(
                  $limit: Int!
                  $offset: Int!
                  $issuers: [String!]!
                ) {
                  cardinal_claim_events(
                    limit: $limit
                    offset: $offset
                    where: { issuer: { _in: $issuers } }
                  ) {
                    token_manager_address
                    mint
                    state
                    state_changed_at
                    issuer
                    recipient_token_account
                    paid_claim_approver_payment_amount
                    mint_address_nfts {
                      name
                      uri
                    }
                  }
                }
              `,
              variables: {
                issuers: config.filter.value,
                limit: 10,
                offset: 0,
              },
            })
      /////
      const indexedClaimEvents = tokenManagerResponse.data[
        'cardinal_claim_events'
      ] as IndexedClaimEvent[]
      transaction.finish()
      return indexedClaimEvents
    },
    {
      refetchOnMount: false,
      enabled: !!config,
    }
  )
}
