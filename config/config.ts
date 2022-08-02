import type { TokenData } from 'apis/api'
import type { AirdropMetadata } from 'common/Airdrop'
import type { IconKey } from 'common/Socials'
import type {
  DurationOption,
  RentalCardConfig,
} from 'rental-components/components/RentalIssueCard'

import type { UserTokenData } from '../hooks/useUserTokenData'

export const COLORS = {
  primary: '#907EFF',
  accent: '#7EFFE8',
  glow: '#CE81F4',
  'light-0': '#FFFFFF',
  'light-1': '#F5E2FF',
  'light-2': '#B1AFBB',
  'medium-3': '#8D8B9B',
  'medium-4': '#6D6C7C',
  'dark-5': '#0B0B0B',
  'dark-6': '#000000',
}

export type Colors = {
  accent: string
  glow: string
}

export type TokenFilter = {
  type: 'creators' | 'symbol' | 'issuer' | 'state' | 'claimer' | 'owner'
  value: string[]
}

export interface TokenSection {
  id: string
  header?: string
  description?: string
  icon?:
    | 'time'
    | 'featured'
    | 'listed'
    | 'rented'
    | 'available'
    | 'info'
    | 'performance'
  filter?: TokenFilter
  tokens?: TokenData[] | UserTokenData[]
  showEmpty?: boolean
}

export type Badge = {
  badgeType: 'recent' | 'trending' | 'expiration'
  position?: 'top-right' | 'top-left' | 'bottom-left' | 'bottom-right'
  content?: JSX.Element | string
}

export type ProjectConfig = {
  type: 'Collection' | 'Guild'
  hidden?: boolean
  indexDisabled?: boolean
  issuedOnly?: boolean
  name: string
  displayName: string
  websiteUrl: string
  hero?: string
  description?: string
  twitterHandle?: string
  socialLinks?: {
    icon: IconKey
    link: string
  }[]
  logoImage: string
  logoPadding?: boolean
  colors: Colors
  badges?: Badge[]
  disableListing?: boolean
  filter?: TokenFilter
  sections?: TokenSection[]
  rentalCard: RentalCardConfig
  airdrops?: AirdropMetadata[]
  showUnknownInvalidators?: boolean
  marketplaceRate?: DurationOption
  allowOneByCreators?: {
    address: string
    enforceTwitter: boolean
    preventMultipleClaims: boolean
    disableReturn: boolean
  }[]
}

export const projectConfigs: { [key: string]: ProjectConfig } = {
  rooniverse: {
    name: 'rooniverse',
    displayName: 'Rooniverse',
    type: 'Collection',
    websiteUrl: 'https://www.playrooniverse.com/',
    logoImage: '/logos/rooniverse.png',
    hero: '/logos/rooniverse-hero.png',
    colors: {
      accent: '#b338ef',
      // #1abfdd alternative
      glow: '#b338ef',
    },
    description:
      'Enter the world of savage, tribal Roos who fight to the death for sport and glory! Collect resources across lands, battle with friends, and build your own corner of Rooniverse! Adopt a Roo to access our Mini-Rooyale pre-alpha demo sessions!',
    twitterHandle: '@playrooniverse',
    socialLinks: [
      {
        icon: 'discord',
        link: 'https://discord.gg/rooniverse',
      },
      {
        icon: 'web',
        link: 'https://www.playrooniverse.com/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/playrooniverse',
      },
    ],
    badges: [{ badgeType: 'recent' }],
    filter: {
      type: 'creators',
      value: [
        '3v6SQ2s8w5TYYzXeS5QLn2AD3sfwQLsg9HM3W2t2QDqE',
        'FzeXx41UqWRqYxic3ftehHSTeq5bmaruYbsMrBn4b9qv',
      ],
    },
    rentalCard: {
      invalidators: ['rate', 'duration'],
      invalidationOptions: {
        visibilities: ['public', 'private'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    marketplaceRate: 'days',
  },
  hoa: {
    name: 'hoa',
    displayName: 'Homeowners Association (Parcl)',
    type: 'Collection',
    websiteUrl: 'https://www.hoa.house/',
    hero: '/logos/parcl-hero.png',
    description:
      'Homeowners Association (HOA) is an NFT project by Parcl, consisting of 7,777 unique combinations of iconic homes from four unique cities.',
    logoImage: '/logos/parcl.gif',
    colors: {
      accent: '#10abf0',
      glow: '#005eff',
    },
    socialLinks: [
      {
        icon: 'discord',
        link: 'https://discord.gg/parcl',
      },
      {
        icon: 'web',
        link: 'https://www.hoa.house/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/parcl',
      },
    ],
    badges: [{ badgeType: 'recent' }],
    filter: {
      type: 'creators',
      value: ['Cp3Fn6azbwtSG9LV1BWtQcAkQQiaQWDkc2LcqwaEuLuq'],
    },
    rentalCard: {
      invalidators: ['rate'],
      invalidationOptions: {
        visibilities: ['public', 'private'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    marketplaceRate: 'days',
    airdrops: [],
  },
  miniroyale: {
    name: 'miniroyale',
    displayName: 'Mini Royale',
    type: 'Collection',
    websiteUrl: 'https://miniroyale.io/',
    hero: '/logos/miniroyale-hero.png',
    description:
      'MiniRoyale is a web browser game with battle royale game mode. The game comes with 3D graphics and unique style.',
    logoImage: '/logos/miniroyale.png',
    logoPadding: true,
    twitterHandle: '@MiniNations',
    colors: {
      accent: '#2584df',
      glow: '#2584df',
    },
    socialLinks: [
      {
        icon: 'discord',
        link: 'https://discord.com/invite/miniroyale',
      },
      {
        icon: 'web',
        link: 'https://miniroyale.io/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/MiniNations',
      },
    ],
    badges: [{ badgeType: 'trending' }],
    filter: {
      type: 'creators',
      value: [
        'CbPuZtVMAWwPySvsUAEbZhe8y9rkeAZ5qLhsGBVvtau9',
        'EpgYkzyAXPDq11G5ngctWcjq7pKSfUtEnjVcYPs2jhGY',
        'EoYTpE5HuTaXkN2AWDAgGA3JbhtPdeqnUiY9rdG7hMf',
        '3TVyY5Tw9CuKj7EJwaawacDqBM5jnbeL1kRUvhDPvxH4',
        'GgT69RnQwQhE8cmnTivRHSPfvXwd3HirdbnHQBaHgqwt',
        '4hgG6XRBwGNsFpuCnBJMGi9iQteWmULM4nX6zSsgDKgz',
      ],
    },
    rentalCard: {
      paymentManager: 'mainnet-cardinal-mini-royale',
      invalidators: ['rate', 'duration', 'expiration', 'manual'],
      invalidationOptions: {
        visibilities: ['public', 'private'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['reissue', 'return'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    marketplaceRate: 'days',
    airdrops: [
      {
        name: 'Miniverse Hero #03016',
        symbol: 'MINIROYALE',
        uri: 'https://arweave.net/QfhzPB4a2txBl1Myumyq4431klq6HjDUwacPfS07W4Y',
      },
      {
        name: 'Miniverse Weapon #184776',
        symbol: 'MINIROYALE',
        uri: 'https://arweave.net/amSCKytNSZy5cxuoJx-PSY0qMQK6ZAZzD4QnzyMzvBk',
      },
      {
        name: 'Miniverse Hero #0720',
        symbol: 'MINIROYALE',
        uri: 'https://bafybeiat55vtqutsbtyz5u3ufjru7iiv6giete4bdu3mbgqhaxjvnelc7u.ipfs.nftstorage.link/89.json',
      },
      {
        name: 'Miniverse Weapon #27339',
        symbol: 'MINIROYALE',
        uri: 'https://tokens.miniroyale.io/token-data?expires=4806495451&id=904c950a-309b-4fee-9bd4-504771ed2df9&token=BhknUWE6vXAElVhxWKE-YX6_4_acumpPP8q3ZQnsvR8',
      },
    ],
  },
  portals: {
    name: 'portals',
    displayName: 'Portals',
    type: 'Collection',
    websiteUrl: 'https://theportal.to/',
    logoImage: '/logos/portals.svg',
    logoPadding: true,
    colors: {
      accent: '#80ddef',
      glow: '#80ddef',
    },
    hero: '/logos/portals-hero.png',
    twitterHandle: '@_portals_',
    description:
      'The Metaverse on Solana. Explore downtown, invite friends, chat, build, show off your NFTs — right in the browser.',
    socialLinks: [
      {
        icon: 'discord',
        link: 'https://discord.gg/9uMBaCPW3f',
      },
      {
        icon: 'web',
        link: 'https://theportal.to/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/_portals_',
      },
    ],
    // sections: [
    // {
    //   header: 'Featured',
    //   description: 'Cardinal Room Design Competition',
    //   icon: 'featured',
    //   filter: {
    //     type: 'issuer',
    //     value: ['5grvMeoBqv5ZdHq9JMy5RrxLPNAt1nzc9cpqYWFUwizz'],
    //   },
    // },
    // {
    //   header: 'Listed',
    //   icon: 'listed',
    //   filter: {
    //     type: 'state',
    //     value: [TokenManagerState.Issued.toString()],
    //   },
    // },
    // {
    //   header: 'Claimed',
    //   icon: 'time',
    //   filter: {
    //     type: 'state',
    //     value: [TokenManagerState.Claimed.toString()],
    //   },
    // },
    // ],
    filter: {
      type: 'creators',
      value: ['5grvMeoBqv5ZdHq9JMy5RrxLPNAt1nzc9cpqYWFUwizz'],
    },
    rentalCard: {
      invalidators: ['rate', 'expiration', 'duration', 'manual'],
      invalidationOptions: {
        visibilities: ['public', 'private'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['reissue', 'return'],
        customInvalidationTypes: {
          '41qJ9dJemw8mrry2BD1wU6B2aHXN4RoNY79bS7xwDPhM': ['return'],
        },
        paymentMints: ['So11111111111111111111111111111111111111112'],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    airdrops: [
      {
        name: 'Portals',
        symbol: 'PRTL',
        uri: 'https://arweave.net/-QsrbBfmFy4Fxp-BtSnSFiajm_KECo5ctRXR6uSBS5k',
      },
      {
        name: 'Portals',
        symbol: 'PRTL',
        uri: 'https://arweave.net/RewRYM3lf-1Ry1hitgsiXuqsuERSujlTAChgl9S483c',
      },
      {
        name: 'Portals',
        symbol: 'PRTL',
        uri: 'https://arweave.net/6ZcTxyREtg0WsOSGSBq-CSyQ3DPlU1k4R_A7mrgehRE',
      },
    ],
    marketplaceRate: 'days',
    // allowOneByCreators: [
    //   {
    //     address: '41qJ9dJemw8mrry2BD1wU6B2aHXN4RoNY79bS7xwDPhM',
    //     enforceTwitter: true,
    //     preventMultipleClaims: true,
    //     disableReturn: false,
    //   },
    // ],
  },
  smb: {
    name: 'smb',
    displayName: 'Solana Monkey Business',
    type: 'Collection',
    websiteUrl: 'https://market.solanamonkey.business/',
    logoImage: '/logos/smb-large.png',
    hero: '/logos/smb-hero.png',
    description: '5000 inspired generative NFTs.',
    socialLinks: [
      {
        icon: 'discord',
        link: 'https://discord.com/invite/solanamonkeybusiness',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/SolanaMBS',
      },
      {
        icon: 'web',
        link: 'https://solanamonkey.business/',
      },
    ],
    colors: {
      accent: '#cccdff',
      glow: '#cccdff',
    },
    filter: {
      type: 'creators',
      value: ['9uBX3ASjxWvNBAD1xjbVaKA74mWGZys3RGSF7DdeDD3F'],
    },
    showUnknownInvalidators: true,
    rentalCard: {
      invalidators: ['rate', 'duration', 'manual'],
      invalidationOptions: {
        visibilities: ['public', 'private'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    airdrops: [
      {
        name: 'SMB #1148',
        symbol: 'SMB',
        uri: 'https://arweave.net/c2i2nLtanzMcWqLwFOE9yiwHoJ1WdvJcpdS54drBD9g',
      },
      {
        name: 'SMB #2712',
        symbol: 'SMB',
        uri: 'https://arweave.net/xhUWFiFbhEz6EjzE05XNvYvpP5U43bNRXvtSKku12oA',
      },
      {
        name: 'SMB #931',
        symbol: 'SMB',
        uri: 'https://arweave.net/d8IpVzCnR5sqkmimkbpxUKj4CLiOQl89ASvt6dTTyWA',
      },
      {
        name: 'SMB #1785',
        symbol: 'SMB',
        uri: 'https://arweave.net/JR_l_iOJVvVSiuySnFKsMbDtZ61deFwkr4-wch_TJzc',
      },
    ],
    marketplaceRate: 'days',
  },
  br1: {
    name: 'br1',
    displayName: 'BR1',
    type: 'Collection',
    websiteUrl: 'https://www.br1game.com/',
    logoImage:
      'https://static.wixstatic.com/media/a5e645_ede493815397419cad3c618bd7cb4aa4~mv2.png/v1/fill/w_888,h_390,al_c,usm_0.66_1.00_0.01,enc_auto/Artboard%202%20copy%204-1.png',
    colors: {
      accent: 'rgb(169,60,239)',
      glow: 'rgb(169,60,239)',
    },
    filter: {
      type: 'creators',
      value: [
        '9yz273zB6rQHyptbSpVvC75o4G17NwJrTk4u2ZiNV3tZ',
        'BTzGQ6yk1uFN9q9Po3LGSvmZ3dxq8nf8WPwr4D12APxo',
      ],
    },
    rentalCard: {
      invalidators: ['rate', 'duration'],
      invalidationOptions: {
        freezeRentalRateDuration: {
          value: '1',
          durationOption: 'days',
        },
        durationOptions: ['hours', 'days', 'weeks', 'years'],
        visibilities: ['public'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        setClaimRentalReceipt: true,
        showClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    marketplaceRate: 'days',
  },
  defiland: {
    name: 'defiland',
    displayName: 'Defi Land',
    type: 'Collection',
    websiteUrl: 'https://www.defiland.app/',
    logoImage: 'https://defiland.app/_nuxt/img/defiland.74b3850.svg',
    logoPadding: true,
    colors: {
      accent: '#CD9373',
      glow: '#CD9373',
    },
    filter: {
      type: 'creators',
      value: [
        '4exgPiVhpromTi8duBsMnscoodAjU1as13s1AXZGsGHP', // harvester
        '3XE8DuYzqZLKr1XqXrvADRTxXWL91KuakqsKfD3cYoLP', // gun
        '5XTbjtKM1whecjXMMdDUz3BzWqEDRuJxTRPX3xTF1qmG',
        'Ajp7uzkyPUU35pGdkjZd9Gbe4zgDQXterWY8ZzvP4sCk', // boat
        '8m4TTZz3RsDVakDSwn7T89GyButxLiMqn2zq7DWfANu7', // cat, cow, dog
      ],
    },
    rentalCard: {
      invalidators: ['rate', 'duration'],
      invalidationOptions: {
        freezeRentalRateDuration: {
          value: '1',
          durationOption: 'days',
        },
        durationOptions: ['hours', 'days', 'weeks', 'years'],
        visibilities: ['public'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        setClaimRentalReceipt: true,
        showClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    marketplaceRate: 'days',
  },
  metaops: {
    name: 'metaops',
    displayName: 'Meta Ops',
    type: 'Collection',
    websiteUrl: 'https://metaopsgaming.com/',
    logoImage: '/logos/metaops.png',
    logoPadding: true,
    colors: {
      accent: '#b55b5e',
      glow: '#b55b5e',
    },
    filter: {
      type: 'creators',
      value: [
        'HZSQf9Qvdmmn1B5e7YBxWnyoafTUFtqjrw8SqvSRwace',
        'GU2nTh3aWQz4AA8Gaih5AmV8WmKt3Y8P6iwy5t9347h',
        '8CWFS9nzXtLd3LGE3GaSLYTAEUzkAoUPwmtq32nJFkSZ',
        'HMduKVo3A19U5EpQdEhPjo9hq9zfZXn8aGVYZp7Vc7fX',
      ],
    },
    rentalCard: {
      invalidators: ['rate', 'duration'],
      invalidationOptions: {
        freezeRentalRateDuration: {
          value: '1',
          durationOption: 'days',
        },
        durationOptions: ['hours', 'days', 'weeks', 'years'],
        visibilities: ['public'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        setClaimRentalReceipt: true,
        showClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    airdrops: [
      {
        name: 'MetaOps PFP #4340',
        symbol: 'MOPFP',
        uri: 'https://storage.googleapis.com/fractal-launchpad-public-assets/metaops-assets/jsons/2789.json',
      },
      {
        name: 'MetaOps PFP #5553',
        symbol: 'MOPFP',
        uri: 'https://storage.googleapis.com/fractal-launchpad-public-assets/metaops-assets/jsons/3160.json',
      },
      {
        name: 'MetaOps PFP #4699',
        symbol: 'MOPFP',
        uri: 'https://storage.googleapis.com/fractal-launchpad-public-assets/metaops-assets/jsons/3102.json',
      },
      {
        name: 'MetaOps PFP #692',
        symbol: 'MOPFP',
        uri: 'https://www.magiceden.io/item-details/4r9jMVm5rXdiCLa2oMLkV2ecL3wmmcoFtsMUJJoum38r',
      },
    ],
    marketplaceRate: 'days',
  },
  psyker: {
    name: 'psyker',
    displayName: 'Psyker',
    type: 'Collection',
    websiteUrl: 'https://psyker.game/',
    logoImage: '/logos/psyker.png',
    colors: {
      accent: '#a4051d',
      glow: '#a4051d',
    },
    filter: {
      type: 'creators',
      value: [
        '8AkWaZh92FwkdPmqbR58FpTkpZjrCrRK648UWu6Kuz8',
        '3aKY2TVrHV7XnjcuYhP2gdUWqF8ra8TA4AL5qWQQz5gr',
        'Gvp1RDYLpbBQg35k3x1zpBxWhXNEPuS1jbLALDH8XCaA',
        // '2e8DoDgFZR3By185CDPJAwNE3h1QsaS1NtndM8NQi3Q5',
        // 'HMduKVo3A19U5EpQdEhPjo9hq9zfZXn8aGVYZp7Vc7fX',
      ],
    },
    rentalCard: {
      invalidators: ['rate', 'duration'],
      invalidationOptions: {
        freezeRentalRateDuration: {
          value: '1',
          durationOption: 'days',
        },
        durationOptions: ['hours', 'days', 'weeks', 'years'],
        visibilities: ['public'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        setClaimRentalReceipt: true,
        showClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    airdrops: [
      {
        name: 'Keycard #1823',
        symbol: 'PSYKC',
        uri: 'https://storage.googleapis.com/fractal-launchpad-public-assets/psyker-assets/jsons/1823.json',
      },
      {
        name: 'Keycard #2157',
        symbol: 'PSYKC',
        uri: 'https://storage.googleapis.com/fractal-launchpad-public-assets/psyker-assets/jsons/2157.json',
      },
      {
        name: 'Keycard #4449',
        symbol: 'PSYKC',
        uri: 'https://storage.googleapis.com/fractal-launchpad-public-assets/psyker-assets/jsons/4449.json',
      },
      {
        name: 'Keycard #1823',
        symbol: 'PSYKC',
        uri: 'https://storage.googleapis.com/fractal-launchpad-public-assets/psyker-assets/jsons/1823.json',
      },
    ],
    marketplaceRate: 'days',
  },
  // empiredao: {
  //   name: 'empiredao',
  //   displayName: 'Empire DAO',
  //   type: 'Collection',
  //   websiteUrl: 'https://empiredao.xyz/',
  //   logoImage: '/logos/empiredao.png',
  //   colors: {
  //     accent: '#CCCDFF',
  //   },
  //   filter: {
  //     type: 'issuer',
  //     value: ['edaoJQRZZ3hfNottaxe9z5o2owJDJgL1bUChiPk15KN'],
  //   },
  //   rentalCard: {
  //     invalidators: ['expiration'],
  //     invalidationOptions: {
  //       visibilities: ['public'],
  //       durationOptions: ['minutes', 'hours', 'days', 'weeks'],
  //       invalidationTypes: ['reissue'],
  //       paymentMints: ['So11111111111111111111111111111111111111112'],
  //       showClaimRentalReceipt: false,
  //       setClaimRentalReceipt: false,
  //       maxDurationAllowed: {
  //         displayText: '3 weeks',
  //         value: 7258000,
  //       },
  //     },
  //   },
  //   marketplaceRate: 'days',
  //   airdrops: [],
  // },
  default: {
    name: 'default',
    displayName: 'Unverified',
    hidden: true,
    type: 'Collection',
    websiteUrl: 'https://cardinal.so',
    logoImage: 'https://main.cardinal.so/assets/cardinal-titled.png',
    colors: {
      accent: '#7560FF',
      glow: '#7560FF',
    },
    rentalCard: {
      invalidators: ['rate', 'duration', 'expiration', 'manual'],
      extensionOptions: { showDisablePartialExtension: true },
      invalidationOptions: {
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    airdrops: [
      {
        name: 'Origin Jambo',
        symbol: 'JAMB',
        uri: 'https://arweave.net/XBoDa9TqiOZeXW_6bV8wvieD8fMQS6IHxKipwdvduCo',
      },
      {
        name: 'Solana Monkey Business',
        symbol: 'SMB',
        uri: 'https://arweave.net/VjfB54_BbELJ5bc1kH-kddrXfq5noloSjkcvK2Odhh0',
      },
      {
        name: 'Degen Ape',
        symbol: 'DAPE',
        uri: 'https://arweave.net/mWra8rTxavmbCnqxs6KoWwa0gC9uM8NMeOsyVhDy0-E',
      },
      {
        name: 'Thugbirdz',
        symbol: 'THUG',
        uri: 'https://arweave.net/l9VXqVWCsiKW-R8ShX8jknFPgBibrhQI1JRgUI9uvbw',
      },
      {
        name: 'Turtles',
        symbol: 'TRTL',
        uri: 'https://arweave.net/KKbhlHaPMOB9yMm9yG_i7PxzK0y24I5C7gNTaRDI9OE',
      },
      {
        name: 'Almost Famous Pandas',
        symbol: 'AFP',
        uri: '8cs7hpBcuiRbzcdUY5BHpCFCgv1m8JhpZEVHUkYTmhnA',
      },
      {
        name: 'Shi Guardians',
        symbol: 'SHI',
        uri: 'https://arweave.net/hSI4WIsX10yRWnzgXP8oqwSCaSgPfGU5nSN-Pxjslao',
      },
      {
        name: 'Hacker House',
        symbol: 'HH',
        uri: 'https://arweave.net/DLDhnabWSXzAYktEhEKyukt3GIfagj2rPpWncw-KDQo',
      },
      {
        name: '21 Club',
        symbol: '21',
        uri: 'https://bafkreicv3jj6oc53kid76mkk7hqsr6edrnhsydkw4do4vonq777sgfz3le.ipfs.dweb.link?ext=json',
      },
    ],
  },
  ['3dgamersguild']: {
    name: '3dgamersguild',
    displayName: '3D Gamers Guild',
    type: 'Guild',
    websiteUrl: 'https://www.3dgamersguild.com/',
    logoImage:
      'https://images.squarespace-cdn.com/content/v1/618b2aec73c8ed19abf2fd2f/c4a759b4-91d5-462a-bd6d-ce3766ffda2f/3D+Gamers+Logo+with+white+letters+white+text.png?format=1500w',
    logoPadding: true,
    colors: {
      accent: '#34659b',
      glow: '#34659b',
    },
    filter: {
      type: 'issuer',
      value: ['9qoRqZmrAf6bqtmTAPA1UkgCRvKuaugF17xBdympy1vd'],
    },
    rentalCard: {
      invalidators: ['rate', 'duration'],
      invalidationOptions: {
        freezeRentalRateDuration: {
          value: '1',
          durationOption: 'days',
        },
        visibilities: ['public'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    marketplaceRate: 'days',
  },
  ['udderchaos']: {
    name: 'udderchaos',
    displayName: 'Udder Chaos',
    type: 'Guild',
    websiteUrl: 'https://www.udderchaos.io/',
    logoImage: 'logos/udderchaos-logo.png',
    colors: {
      accent: '#f9e7c9',
      glow: '#f9e7c9',
    },
    description:
      'Udder Chaos is a project built on a sustainable business model. Operating a Solana Validator drives consistent income for the project on top of accent sales, while also being supported by their RPC rentals and NFT rental treasury. They are also developing Alpha Audits, an NFT reviewing platform with a review-to-earn mechanism.',
    hero: 'logos/udderchaos-hero.png',
    socialLinks: [
      {
        icon: 'twitter',
        link: 'https://twitter.com/UdderChaosSOL',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/udderchaos',
      },
      {
        icon: 'web',

        link: 'https://www.udderchaos.io/',
      },
    ],
    badges: [{ badgeType: 'recent' }],
    filter: {
      type: 'issuer',
      value: ['F65oeXXQaDQYnmQKTmmMpZ5XaLBzoUC16pMTg59RfpK6'],
    },
    rentalCard: {
      invalidators: ['rate', 'duration'],
      invalidationOptions: {
        visibilities: ['public'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['reissue'],
        paymentMints: [
          'MLKmUCaj1dpBY881aFsrBwR9RUMoKic8SWT3u1q5Nkj',
          'So11111111111111111111111111111111111111112',
        ],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    marketplaceRate: 'days',
  },
  ['fatcats']: {
    name: 'fatcats',
    displayName: 'Fatcats',
    type: 'Guild',
    websiteUrl: 'https://fatcatscapital.com/',
    logoImage: 'logos/fatcats.png',
    colors: {
      accent: '#397fd6',
      glow: '#397fd6',
    },
    description:
      'The FatCats Capital Club (FCC) is a community focused on the development of projects looking to advance the Solana ecosystem as a whole. Through the FatCats Accelerator program, both holders and project creators can benefit from services the FCC provides.',
    hero: 'logos/fatcats-hero.png',
    socialLinks: [
      {
        icon: 'twitter',
        link: 'https://twitter.com/fatcatscapital',
      },
      {
        icon: 'discord',
        link: 'https://discord.com/invite/9FnX58FWVB',
      },
      {
        icon: 'web',
        link: 'https://fatcatscapital.com/',
      },
    ],
    badges: [{ badgeType: 'recent' }],
    filter: {
      type: 'issuer',
      value: ['Dx2svFqyhm1eFQTvKrETehLmrNHpNXhioqSHpXGzp5Xe'],
    },
    rentalCard: {
      invalidators: ['rate', 'duration'],
      invalidationOptions: {
        visibilities: ['public'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['reissue'],
        paymentMints: ['FdviznPoMEakdJ37fikNxhoscyruUHSHNkKyvntSqbuo'],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    marketplaceRate: 'days',
  },
  ['thedegenerates']: {
    name: 'thedegenerates',
    displayName: 'The Degenerates',
    type: 'Guild',
    websiteUrl: 'https://thedegen.app/',
    logoImage: 'logos/thedegenerates.png',
    colors: {
      accent: '#ff7921',
      glow: '#ff7921',
    },
    description:
      'For degenerates by degenerates and home for all degenerates. Slowly taking over the Solana blockchain and beyond with tool help and info such as Mint Bot and sniper features, RPC locations, Degen Alerts, Wallet Manager, RPC Tester and Listing manager. Tool reviews and ratings by your fellow degenerates. Come get your degen on!',
    hero: 'logos/thedegenerates-hero.png',
    socialLinks: [
      {
        icon: 'twitter',
        link: 'https://twitter.com/_DegeneratesNFT',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/thedegenerates',
      },
      {
        icon: 'web',
        link: 'https://thedegen.app/',
      },
    ],
    badges: [{ badgeType: 'recent' }],
    filter: {
      type: 'issuer',
      value: ['E6m3sYbjbzCVqtMpDuWjMBnJneJu5a4VnTorz8hpCDB5'],
    },
    rentalCard: {
      invalidators: ['rate'],
      invalidationOptions: {
        visibilities: ['public'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '1 week',
          value: 604800,
        },
      },
    },
    marketplaceRate: 'days',
  },
  ['syndicate-initiative']: {
    name: 'syndicate-initiative',
    displayName: 'SyNdicate Initiative',
    type: 'Guild',
    websiteUrl: 'https://www.twitch.tv/syndicateinitiative',
    logoImage: 'logos/syndicate-initiative.png',
    colors: {
      accent: '#A45EE5',
      glow: '#A45EE5',
    },
    description:
      'Syndicate Initiative is a community of gamers focused on good vibes and competitive gaming in the developing web3 space. We coach eSports players and stream content on Twitch. Let’s build SyNi together and make a name in the web3 gaming space! #SyNi',
    hero: 'logos/syndicate-initiative-hero.png',
    socialLinks: [
      {
        icon: 'twitter',
        link: 'https://twitter.com/ItzSyNi',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/gz34uBgQMN',
      },
      {
        icon: 'web',
        link: 'https://www.twitch.tv/syndicateinitiative',
      },
    ],
    badges: [{ badgeType: 'recent' }],
    filter: {
      type: 'issuer',
      value: ['7Rinf5mQGHccRnxE6J2p2xNFjpNCh4sgVdpsiyQ9NRHc'],
    },
    rentalCard: {
      invalidators: ['rate', 'duration'],
      invalidationOptions: {
        visibilities: ['public'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    marketplaceRate: 'days',
  },
}
