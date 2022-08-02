import { utils } from '@project-serum/anchor'
import QRCodeStyling from '@solana/qr-code-styling'
import type { Keypair } from '@solana/web3.js'
import type { TokenData } from 'apis/api'
import { useRecentSignatures } from 'hooks/useRecentSignatures'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import React, { useEffect, useMemo, useRef, useState } from 'react'

function ClaimQRCode({
  tokenData,
  keypair,
}: {
  tokenData?: TokenData | null
  keypair?: Keypair
}) {
  const { config } = useProjectConfig()
  const [QRCode, setQRCode] = useState<QRCodeStyling>()
  const [showSuccess, setShowSuccess] = useState(false)
  const recentSignatures = useRecentSignatures(tokenData?.tokenManager?.pubkey)

  const generateQrCode = () => {
    console.log(
      'Generating QR code for request:/claim/ ',
      `solana:${encodeURIComponent(
        getLink(
          `/api/claim?id=${tokenData?.tokenManager?.pubkey.toString()}&collection=${
            config.name
          }${
            keypair
              ? `&keypair=${utils.bytes.bs58.encode(keypair.secretKey)}`
              : ''
          }`,
          false
        )
      )}`
    )

    const qrCode = new QRCodeStyling({
      width: 362,
      height: 362,
      type: 'svg',
      data: `solana:${encodeURIComponent(
        getLink(
          `/api/claim?id=${tokenData?.tokenManager?.pubkey.toString()}&collection=${
            config.name
          }${
            keypair
              ? `&keypair=${utils.bytes.bs58.encode(keypair.secretKey)}`
              : ''
          }`,
          false
        )
      )}`,
      image: config.logoImage,
      dotsOptions: {
        color: config.colors.accent,
        type: 'extra-rounded',
      },
      cornersSquareOptions: {
        type: 'extra-rounded',
      },
      backgroundOptions: {
        color: 'none',
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 20,
      },
    })
    setQRCode(qrCode)
  }

  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current && QRCode) {
      ref.current.firstChild && ref.current.removeChild(ref.current.firstChild)
      QRCode.append(ref.current)
    }
  }, [ref, QRCode])

  useMemo(() => {
    if (typeof window !== 'undefined') {
      generateQrCode()
    }
  }, [keypair?.publicKey.toString(), typeof window])

  const recentSignature =
    recentSignatures.data && recentSignatures.data[0]
      ? recentSignatures.data[0].signature
      : ''
  useEffect(() => {
    if (recentSignatures.data && recentSignatures.data?.length > 0) {
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
      }, 4000)
    }
  }, [recentSignature])

  return (
    <>
      {!QRCode ? (
        <></>
      ) : (
        <div className="relative flex flex-col items-center justify-center rounded-2xl">
          <div ref={ref} className="scale-[.7] md:scale-100" />
        </div>
      )}
    </>
  )
}

export default ClaimQRCode
