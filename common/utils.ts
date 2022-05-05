import type { TokenData } from './../api/api';
import type * as web3 from '@solana/web3.js'

export type Cluster = web3.Cluster | 'mainnet' | 'localnet'

export function getExpirationString(expiration: number, UTCSecondsNow: number) {
  let day = (expiration - UTCSecondsNow) / 60 / 60 / 24
  let hour = ((expiration - UTCSecondsNow) / 60 / 60) % 24
  let minute = ((expiration - UTCSecondsNow) / 60) % 60
  let second = (expiration - UTCSecondsNow) % 60
  const floorOrCeil = (n: number) =>
    expiration - UTCSecondsNow > 0 ? Math.floor(n) : Math.ceil(n)

  day = day < 0 ? 0 : day
  hour = hour < 0 ? 0 : hour
  minute = minute < 0 ? 0 : minute
  second = second < 0 ? 0 : second

  return `${floorOrCeil(day)}d ${floorOrCeil(hour)}h ${floorOrCeil(
    minute
  )}m ${floorOrCeil(second)}s`
}

export function shortPubKey(
  pubkey: web3.PublicKey | string | null | undefined
) {
  if (!pubkey) return ''
  return `${pubkey?.toString().substring(0, 4)}..${pubkey
    ?.toString()
    .substring(pubkey?.toString().length - 4)}`
}

export function pubKeyUrl(
  pubkey: web3.PublicKey | null | undefined,
  cluster: string
) {
  if (!pubkey) return 'https://explorer.solana.com'
  return `https://explorer.solana.com/address/${pubkey.toString()}${
    cluster === 'devnet' ? '?cluster=devnet' : ''
  }`
}

export function shortDateString(utc_seconds: number) {
  return `${new Date(utc_seconds * 1000).toLocaleDateString([], {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  })} ${new Date(utc_seconds * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

export function longDateString(utcSeconds: number) {
  return new Date(utcSeconds * 1000).toLocaleTimeString(['en-US'], {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

export function secondstoDuration(durationSeconds: number) {
  const years = Math.floor(durationSeconds / 31449600)
  const months = Math.floor((durationSeconds % 31449600) / 2419200)
  const weeks = Math.floor((durationSeconds % 2419200) / 604800)
  const days = Math.floor((durationSeconds % 604800) / 86400)
  const hours = Math.floor((durationSeconds % 86400) / 3600)
  const minutes = Math.floor((durationSeconds % 3600) / 60)
  const seconds = durationSeconds % 60
  let duration = ''
  const optionalVals = [`${years}Y`, `${months}M`, `${weeks}w`, `${days}d`]
  const vals = [`${hours}h`, `${minutes}m`, `${seconds}s`]
  for (const val of optionalVals) {
    if (parseInt(val.substring(0, val.length - 1)) > 0) {
      duration += val + ' '
    }
  }
  for (const val of vals) {
    duration += val + ' '
  }
  return duration
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

export const camelCase = (str: string) => {
  return str
    .split(' ')
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join('')
}

export const capitalizeFirstLetter = (value: string) => {
  return value[0] ? value[0].toUpperCase() + value.slice(1) : ''
}

export const secondsToString = (
  requiredSeconds: number | undefined | null,
  showSeconds = true
) => {
  if (!requiredSeconds || requiredSeconds === 0) return '0'
  const weeks = Math.floor(requiredSeconds / 60 / 60 / 24 / 7)
  const days = Math.floor((requiredSeconds / 60 / 60 / 24) % 7)
  const hours = Math.floor((requiredSeconds / 60 / 60) % 24)
  const minutes = Math.floor((requiredSeconds / 60) % 60)
  const seconds = Math.round(requiredSeconds % 60)

  return `${weeks ? `${weeks}w ` : ''} ${days ? `${days}d ` : ''}${
    !weeks && hours ? `${hours}h ` : ''
  }${!weeks && minutes ? `${minutes}m ` : ''}${
    seconds && showSeconds ? `${seconds}s` : ''
  }`
}

export const getAllAttributes = (tokens: TokenData[]) => {
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
