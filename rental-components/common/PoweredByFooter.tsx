import { LogoTitled } from '../common/LogoTitled'

export const PoweredByFooter = () => {
  return (
    <div className="mt-6 flex items-center justify-center gap-1">
      <div>Powered by</div>
      <LogoTitled className="h-4" />
    </div>
  )
}
