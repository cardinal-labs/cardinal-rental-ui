import {
  WalletMultiButton,
  useWalletModal,
} from '@solana/wallet-adapter-react-ui'
import styled from '@emotion/styled'
import Colors from 'common/colors'
import { LoadingPulse } from './LoadingPulse'
import { useState } from 'react'
import { useMediaQuery } from 'react-responsive'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import {
  AddressImage,
  DisplayAddress,
  useAddressName,
} from '@cardinal/namespaces-components'
import { shortPubKey } from './utils'
import { HiUserCircle } from 'react-icons/hi'
import { Airdrop } from './Airdrop'

export const StyledHeader = styled.div<{ isTabletOrMobile: boolean }>`
  z-index: 100;
  position: fixed;
  transition-delay: 10s;
  padding: 0px 3%;
  @media (max-width: 500px) {
    padding: 0px 20px;
  }
  justify-content: space-between;
  display: flex;
  transition: 2s;
  top: 0;
  width: 100%;
  height: 100px;
  align-items: center;

  .left {
    display: flex;
    align-items: center;
    gap: 18px;

    img {
      height: 35px;
      width: auto;
    }
  }

  .right {
    position: relative;
    display: flex;
    align-items: center;
    gap: 18px;
    justify-content: flex-end;

    button {
      background: none;

      &:hover {
        background: none;
      }
    }
  }

  .center {
    color: rgba(255, 255, 255, 0.8);
    font-weight: 200;
    padding: 0px 20px;
  }

  .title {
    color: rgba(255, 255, 255, 0.8);
    font-size: 40px;
    position: relative;

    .subscript {
      font-size: 10px;
      font-style: italic;
      position: absolute;
      bottom: 5px;
      right: -35px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      padding: 3px 5px;
    }

    img {
      width: auto;
      max-width: none;
    }
  }

  .vote {
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.8);
    padding: 4px 10px;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition: 0.3s;
    margin-top: 10px;
    display: inline-block;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 1);
    }
  }

  .back {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.3s;
    font-size: 20px;

    i {
      transition: 0.3s;
      color: rgba(255, 255, 255, 0.8);
      margin-right: 5px;
      margin-top: 3px;
    }
    span {
      font-size: 24px;
      color: rgba(255, 255, 255, 0.8);
    }
    &:hover {
      i {
        margin-right: 7px;
        color: rgba(255, 255, 255, 0.8);
      }
      span {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }
`

export const Hamburger = styled.div`
    cursor: pointer;
    padding: 5px 0px;
    margin-right: 10px;

    .hamb-line {
      background: ${Colors.white};
      display: block;
      height: 2px;
      position: relative;
      width: 24px;
    }

    .hamb-line::before,
    .hamb-line::after {
      background: ${Colors.white};
      content: '';
      display: block;
      height: 100%;
      position: absolute;
      transition: all 0.2s ease-out;
      width: 100%;
    }
    .hamb-line::before {
      top: 5px;
    }
    .hamb-line::after {
      top: -5px;
    }
  }
`

export const StyledTabs = styled.div<{ show: boolean }>`
  display: ${({ show }) => (show ? 'flex' : 'none')};
  font-size: 13px;

  @media (min-width: 1224px) {
    margin: 30px auto;
    top: 20px;
    padding: 5px;
    position: relative;
    max-width: 600px;
    background-color: ${Colors.navBg};
    border-radius: 20px;
    align-items: center;
    gap: 5px;

    .vline {
      width: 1px;
      height: 20px;
      background: ${Colors.lightGray};
      opacity: 0;
    }
  }
  @media (max-width: 1224px) {
    height: 100vh;
    width: 100vw;
    position: absolute;
    left: 0;
    top: 0;
    text-align: center;
    align-items: center;
    flex-direction: column;
    justify-content: space-around;
    padding: 30% 0px;
    background-color: ${Colors.navBg};
  }
`

export const StyledTab = styled.div<{ selected: boolean; disabled: boolean }>`
  border-radius: 20px;
  background: ${(props) => (props.selected ? Colors.lightGrayBg : 'none')};
  color ${(props) => (props.disabled ? Colors.lightGrayBg : Colors.white)};
  text-align: center;
  width: 150px;
  padding: 10px 20px;
  cursor: pointer;
  transition: 0.3s all;
  &:hover {
    background: ${Colors.darkGrayBg};
  }
`

const StyledProfile = styled.div`
  display: flex;
  gap: 10px;
  .info {
    color: white;
    font-size: 14px;
  }
`

export const Header = ({
  tabs,
  loading,
}: {
  tabs?: React.ReactNode
  loading?: boolean
}) => {
  const ctx = useEnvironmentCtx()
  const wallet = useWallet()
  const { setVisible } = useWalletModal()
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' })
  const [showTabs, setShowTabs] = useState(false)

  const { displayName } = useAddressName(
    ctx.connection,
    wallet?.publicKey || undefined
  )

  const walletAddressFormatted = wallet?.publicKey
    ? shortPubKey(wallet?.publicKey)
    : ''

  return (
    <StyledHeader isTabletOrMobile={isTabletOrMobile}>
      <div className="left">
        <div className="title">
          <img src="/assets/cardinal-titled.png" />
          <div className="subscript">
            {ctx.environment.label === 'devnet' ? 'DEV' : 'alpha'}
          </div>
        </div>
        {wallet.connected && (
          <div style={{ marginLeft: '40px' }}>
            <Airdrop />
          </div>
        )}
      </div>
      <div className="center">
        {/* {tabs && (
          <StyledTabs show={!isTabletOrMobile || showTabs}>
            {tabs}
            <div
              style={{
                position: 'absolute',
                color: 'white',
                width: '30px',
                height: '30px',
                right: -50,
              }}
            >
              <LoadingPulse loading={loading ?? false} />
            </div>
          </StyledTabs>
        )} */}
      </div>
      <div className="right">
        <div
          style={{
            position: 'absolute',
            color: 'white',
            width: '30px',
            height: '30px',
            left: -50,
          }}
        >
          <LoadingPulse loading={loading ?? false} />
        </div>
        {wallet.connected ? (
          <StyledProfile onClick={() => setVisible(true)}>
            <AddressImage
              connection={ctx.connection}
              address={wallet.publicKey || undefined}
              height="40px"
              width="40px"
              dark={true}
              placeholder={
                <div
                  style={{
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ height: '40px', width: '40px' }}>
                    <HiUserCircle style={{ height: '100%', width: '100%' }} />
                  </div>
                </div>
              }
            />
            <div className="info">
              <div>
                <DisplayAddress
                  connection={ctx.connection}
                  address={wallet.publicKey || undefined}
                  height="12px"
                  width="100px"
                  dark={true}
                />
              </div>
              <div style={{ color: Colors.lightGray }}>
                {walletAddressFormatted}
              </div>
            </div>
          </StyledProfile>
        ) : (
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
        )}
      </div>
    </StyledHeader>
  )
}
