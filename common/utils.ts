import type * as web3 from '@solana/web3.js'

export type Cluster = web3.Cluster | 'mainnet' | 'localnet'

export function transactionUrl(txid: string, cluster: string) {
  return `https://explorer.solana.com/tx/${txid}${
    cluster === 'devnet' ? '?cluster=devnet' : ''
  }`
}

export function pubKeyUrl(
  pubkey: web3.PublicKey | null | undefined,
  cluster: Cluster
) {
  if (!pubkey) return 'https://explorer.solana.com'
  return `https://explorer.solana.com/address/${pubkey.toString()}/metadata${
    cluster === 'devnet' ? '?cluster=devnet' : ''
  }`
}

export function metadataUrl(
  pubkey: web3.PublicKey | null | undefined,
  cluster: string
) {
  if (!pubkey) return 'https://www.magiceden.io/item-details/'
  return `https://www.magiceden.io/item-details/${pubkey.toString()}${
    cluster === 'devnet' ? '?cluster=devnet' : ''
  }`
}

// eslint-disable-next-line @typescript-eslint/ban-types
export const withSleep = async (fn: Function, sleep = 2000) => {
  await new Promise((r) => setTimeout(r, sleep))
  await fn()
}

/**
 *
 * @param {string} name
 * @returns {string|null}
 */
export function getQueryParam(url: string, name: string) {
  if (!url || !name) return null
  const q = url.match(new RegExp('[?&]' + name + '=([^&#]*)'))
  return q && q[1]
}

export const firstParam = (param: string | string[] | undefined): string => {
  if (!param) return ''
  return typeof param === 'string' ? param : param[0] || ''
}
