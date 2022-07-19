import type { Wallet } from '@saberhq/solana-contrib'
import type { Connection } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { Modal } from 'common/Modal'
import { withSleep } from 'common/utils'
import React, { useContext, useState } from 'react'

import type { RentalCardConfig } from './components/RentalCard'
import { RentalCard } from './components/RentalCard'

export interface RentalModal {
  show: (
    wallet: Wallet,
    connection: Connection,
    cluster: string,
    tokenDatas: TokenData[],
    rentalCardConfig: RentalCardConfig | undefined,
    dev?: boolean
  ) => void
  showRentalModal: boolean
  tokenDatas: TokenData[] | undefined
}

export const RentalModalContext = React.createContext<RentalModal | null>(null)

interface Props {
  appName?: string
  appTwitter?: string
  children: React.ReactNode
}

export const RentalModalProvider: React.FC<Props> = ({
  appName,
  appTwitter,
  children,
}: Props) => {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [connection, setConnection] = useState<Connection | null>(null)
  const [cluster, setCluster] = useState<string | undefined>(undefined)
  const [dev, setDev] = useState<boolean | undefined>(undefined)
  const [showRentalModal, setShowRentalModal] = useState<boolean>(false)
  const [tokenDatas, setTokenDatas] = useState<TokenData[] | undefined>(
    undefined
  )
  const [rentalCardConfig, setRentalCardConfig] = useState<
    RentalCardConfig | undefined
  >(undefined)

  return (
    <RentalModalContext.Provider
      value={{
        show: (
          wallet,
          connection,
          cluster,
          tokenDatas,
          rentalCardConfig,
          dev
        ) => {
          setWallet(wallet)
          setConnection(connection)
          setCluster(cluster)
          setTokenDatas(tokenDatas)
          setDev(dev)
          setShowRentalModal(true)
          setRentalCardConfig(rentalCardConfig)
        },
        tokenDatas,
        showRentalModal,
      }}
    >
      <Modal
        isOpen={showRentalModal}
        onDismiss={() => setShowRentalModal(false)}
      >
        {wallet && connection && (
          <RentalCard
            dev={dev}
            cluster={cluster}
            wallet={wallet}
            connection={connection}
            tokenDatas={tokenDatas || []}
            rentalCardConfig={rentalCardConfig || { invalidators: [] }}
            appName={appName}
            appTwitter={appTwitter}
            onComplete={() => {
              withSleep(() => {
                setShowRentalModal(false)
              }, 1000)
            }}
          />
        )}
      </Modal>
      {children}
    </RentalModalContext.Provider>
  )
}

export const useRentalModal = (): RentalModal => {
  const rentalModalContext = useContext(RentalModalContext)
  if (!rentalModalContext) {
    throw new Error('Not in rentalModalContext context')
  }
  return rentalModalContext
}
