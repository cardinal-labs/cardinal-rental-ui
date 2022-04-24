import styled from '@emotion/styled'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Header } from 'common/Header'
import { StyledContainer } from 'common/StyledContainer'
import { Browse } from 'components/Browse'
import { Collections } from 'components/Collections'
import { Manage } from 'components/Manage'
import { Wallet } from 'components/Wallet'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useError } from 'providers/ErrorProvider'
import { useMetadataData } from 'providers/MetadataProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUserTokenData } from 'providers/TokenDataProvider'
import { useEffect, useState } from 'react'

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
  const [error, _setError] = useError()
  const wallet = useWallet()
  const router = useRouter()
  const [tab, setTab] = useState<string>('')
  const { metadata, setMetadata, values, setValues } = useMetadataData()

  useEffect(() => {
    const anchor = router.asPath.split('#')[1]
    if (anchor !== tab) setTab(anchor || '')
  }, [router, tab])

  useEffect(() => {
    const { collection, host, cluster } = router.query
    if (
      config.name !== 'default' &&
      !host?.includes(config.name) &&
      collection !== config.name
    ) {
      router.push(
        `${location.pathname}?collection=${config.name}${
          cluster ? `&cluster=${cluster}` : ''
        }#browse`
      )
    } else if (config.name === 'default') {
      router.push(
        `${location.pathname}${cluster ? `?cluster=${cluster}` : ''}#browse`
      )
    }
  }, [config])

  const { setAddress, loaded, refreshing } = useUserTokenData()
  useEffect(() => {
    if (wallet && wallet.connected && wallet.publicKey) {
      setAddress(wallet.publicKey.toBase58())
      setTab('browse')
      router.push(`${location.pathname}${location.search}#browse`)
    }
  }, [wallet.publicKey])

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: config.colors.main }}
    >
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
      {tab ? (
        <>
          <Header
            loading={loaded && refreshing}
            tabs={[
              {
                name: 'Wallet',
                anchor: wallet.publicKey?.toBase58() || 'wallet',
                disabled: !wallet.connected,
              },
              {
                name: 'Manage',
                anchor: 'manage',
                disabled: !wallet.connected || config.disableListing,
              },
              { name: 'Browse', anchor: 'browse' },
            ]}
          />
          <StyledContainer style={{ paddingTop: '120px' }}>
            <div className="my-10 ml-2 flex text-white">
              <div className="text-base font-semibold">Metadata:</div>
              <input
                id="metadata-input"
                autoComplete="off"
                className="mx-4 block appearance-none rounded border border-gray-500 bg-gray-700 px-2 py-1 leading-tight text-gray-200 placeholder-gray-500 focus:bg-gray-800 focus:outline-none focus:outline-none"
                type="text"
                placeholder={'type: rarity [↵ Enter]'}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    if ((e.target as HTMLInputElement).value.length > 0) {
                      setMetadata([
                        ...metadata,
                        (e.target as HTMLInputElement).value,
                      ])
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }
                }}
              />
              {metadata.length > 0 && (
                <input
                  id="metadata-input"
                  autoComplete="off"
                  className="mx-2 block appearance-none rounded border border-gray-500 bg-gray-700 px-2 py-1 leading-tight text-gray-200 placeholder-gray-500 focus:bg-gray-800 focus:outline-none focus:outline-none"
                  type="text"
                  placeholder={'value: special [↵ Enter]'}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      if ((e.target as HTMLInputElement).value.length > 0) {
                        setValues([
                          ...values,
                          (e.target as HTMLInputElement).value,
                        ])
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    }
                  }}
                />
              )}
              <div className="mt-1">
                {metadata.length > 0 && (
                  <span className="pl-5 pr-2">Types: </span>
                )}
                {metadata.map((m) => (
                  <span
                    className="mr-5 rounded-lg border-2 px-2 py-0.5"
                    key={m}
                    onDoubleClick={() => {
                      setMetadata(metadata.filter((x) => x !== m))
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
              <div className="mt-1">
                {values.length > 0 && (
                  <span className="pl-5 pr-2">Values: </span>
                )}
                {values.map((m) => (
                  <span
                    className="mr-5 rounded-lg border-2 px-2 py-0.5"
                    key={m}
                    onDoubleClick={() => {
                      setValues(values.filter((x) => x !== m))
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              {error}
              {(() => {
                switch (tab) {
                  case 'browse':
                    return config.name === 'default' ? (
                      <Collections setTab={setTab} />
                    ) : (
                      <Browse config={config} />
                    )
                  case 'manage':
                    return <Manage />
                  default:
                    return <Wallet />
                }
              })()}
            </div>
          </StyledContainer>
          <div style={{ marginTop: '100px' }} />
        </>
      ) : (
        <div className="flex min-h-screen flex-col items-center">
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
      )}
    </div>
  )
}
