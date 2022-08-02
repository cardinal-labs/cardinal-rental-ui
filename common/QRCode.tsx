import QRCodeStyling from '@solana/qr-code-styling'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useEffect, useMemo, useRef, useState } from 'react'

export const QRCode = ({ data }: { data: string }) => {
  const { config } = useProjectConfig()
  const [QRCode, setQRCode] = useState<QRCodeStyling>()
  const generateQrCode = () => {
    const qrCode = new QRCodeStyling({
      width: 362,
      height: 362,
      type: 'svg',
      data: data,
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
  }, [data, typeof window])

  return (
    <div className="relative flex flex-col items-center justify-center rounded-2xl">
      <div ref={ref} className="scale-[.7] md:scale-100" />
    </div>
  )
}
