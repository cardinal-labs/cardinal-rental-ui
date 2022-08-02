import { firstParam } from '@cardinal/common'
import { utils } from '@project-serum/anchor'
import { Keypair } from '@solana/web3.js'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

export const useOtp = () => {
  const { query } = useRouter()
  const [otp, setOtp] = useState<Keypair>()

  useMemo(() => {
    try {
      setOtp(
        Keypair.fromSecretKey(utils.bytes.bs58.decode(firstParam(query.otp)))
      )
    } catch (e) {}
  }, [query.otp])

  return otp
}
