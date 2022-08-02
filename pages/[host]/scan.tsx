import styled from '@emotion/styled'
import type { PublicKey } from '@solana/web3.js'
import { sendAndConfirmRawTransaction, Transaction } from '@solana/web3.js'
import { HeaderSlim } from 'common/HeaderSlim'
import { LoadingPulseWrapped } from 'common/LoadingPulse'
import { StyledBackground } from 'common/StyledBackground'
import { firstParam, pubKeyUrl } from 'common/utils'
import { useRouter } from 'next/router'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useEffect, useState } from 'react'
import { FaCheckCircle, FaQuestionCircle } from 'react-icons/fa'

type Hideable = {
  visible?: boolean
}

enum VerificationStatus {
  WARNING,
  ERROR,
  SUCCESS,
}

type VerficationResult = {
  status: VerificationStatus
  data?: any
}

interface Verifiable extends Hideable {
  status?: VerificationStatus
}

const formatError = (error: string): string => {
  if (error.includes('0x1774')) {
    return 'No more usages remaining'
  } else {
    return error
  }
}

const VerificationStep = styled.div<Verifiable>`
  transition: height 0.3s;
  height: ${(props) => (props.visible ? '500px' : '0px')};
  box-shadow: ${(props) => {
    if (props.visible) {
      switch (props.status) {
        case VerificationStatus.WARNING:
          return '0 0 30px 20px rgba(255, 200, 50, 0.5)'
        case VerificationStatus.ERROR:
          return '0 0 30px 20px rgba(255, 0, 50, 0.3)'
        default:
          return '0 0 80px 50px rgba(255, 255, 255, 0.3)'
      }
    }
  }};
`
export default function Scan() {
  const router = useRouter()
  const ctx = useEnvironmentCtx()
  const { tx } = router.query
  const { config } = useProjectConfig()

  const [owner, setOwner] = useState<PublicKey | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [executeResult, setExecuteResult] = useState<
    VerficationResult | undefined
  >(undefined)

  useEffect(() => {
    handleExecute()
  }, [setError, tx])

  const handleExecute = async () => {
    const executePromise: Promise<VerficationResult> = new Promise(
      async (res) => {
        try {
          const buffer = Buffer.from(
            decodeURIComponent(firstParam(tx)),
            'base64'
          )
          const transaction = Transaction.from(buffer)
          setOwner(transaction.feePayer)
          const txid = await sendAndConfirmRawTransaction(
            ctx.connection,
            transaction.serialize(),
            { commitment: 'singleGossip' }
          )
          return res({ status: VerificationStatus.SUCCESS })
        } catch (e: any) {
          console.log(e)
          setError(e)
          return res({ status: VerificationStatus.ERROR })
        }
      }
    )

    const [executeResult] = await Promise.all([executePromise])
    setExecuteResult(executeResult)
  }

  return (
    <>
      <HeaderSlim />
      <div
        style={{
          paddingTop: 'calc(50vh - 425px)',
        }}
        className="flex flex-col"
      >
        <VerificationStep
          visible={true}
          status={executeResult?.status}
          className="relative mx-auto flex w-11/12 max-w-[500px] flex-col items-center rounded-xl text-white"
        >
          <div
            className="py-5 text-center"
            style={{
              fontFamily: 'Oswald, sans-serif',
            }}
          >
            <div className="text-[28px] uppercase">Using Asset</div>
          </div>
          <div className="absolute top-[55%] left-1/2 flex h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            <LoadingPulseWrapped loading={!executeResult}>
              {executeResult?.status === VerificationStatus.SUCCESS ? (
                <>
                  <div
                    style={{
                      fontSize: '170px',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    <FaCheckCircle />
                  </div>
                  <div style={{ marginTop: '25px' }}>
                    Use transaction signed by{' '}
                    <a
                      className="address"
                      href={pubKeyUrl(owner, ctx.environment.label)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {owner?.toString()}
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-center text-[170px]">
                    <FaQuestionCircle />
                  </div>
                  {error && (
                    <div
                      className="mt-8 text-center font-extralight"
                      style={{
                        fontFamily: 'Oswald, sans-serif',
                      }}
                    >
                      {formatError(`${error}`)}
                    </div>
                  )}
                </>
              )}
            </LoadingPulseWrapped>
          </div>
        </VerificationStep>
      </div>
      <StyledBackground colors={config.colors} />
    </>
  )
}
