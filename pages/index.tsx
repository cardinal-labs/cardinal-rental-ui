import styled from '@emotion/styled'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useEffect } from 'react'

const StyledSplash = styled.div`
  margin-top: 30vh;
  width: 70%;
  max-width: 400px;
  position: relative;
  color: rgba(255, 255, 255, 0.8);

  .title {
    text-align: center;
    position: relative;
  }

  .subscript {
    font-size: 10px;
    font-style: italic;
    position: absolute;
    right: -35px;
    bottom: 5px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    padding: 3px 5px;
  }
`

export default function Home() {
  const { config } = useProjectConfig()
  const wallet = useWallet()
  const router = useRouter()

  useEffect(() => {
    if (wallet && wallet.connected && wallet.publicKey) {
      router.push(
        `/${wallet.publicKey.toBase58()}${window.location.search ?? ''}`
      )
    }
  }, [wallet.publicKey, router])

  return (
    <div className="flex min-h-screen flex-col items-center">
      <Head>
        <title>Cardinal</title>
        <link rel="icon" href="/favicon.ico" />

        <link
          href="https://fonts.googleapis.com/css2?family=Roboto&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Lato:wght@100&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Kanit:ital@0;1&family=Oswald:wght@200;300;400;500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Karla:wght@600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <StyledSplash>
        <div className="title">
          <img className="mx-auto w-24" src={config.logoImage} alt="logo" />
          <p className="mt-3 text-2xl">
            {config.name.charAt(0).toUpperCase() +
              config.name.substring(1, config.name.length)}
          </p>
          <p className="text-md mt-3">
            The Rental Marketplace for all{' '}
            {config.name.charAt(0).toUpperCase() +
              config.name.substring(1, config.name.length)}{' '}
            NFTs
          </p>
        </div>
        <div className="mt-5 flex items-center justify-center">
          <WalletMultiButton
            style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '14px',
              zIndex: 10,
              height: '38px',
              border: 'none',
              background: 'none',
              backgroundColor: 'none',
            }}
          />
        </div>
      </StyledSplash>
    </div>
  )
}
