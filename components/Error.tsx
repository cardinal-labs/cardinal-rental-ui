import { GlyphQuestion } from 'assets/GlyphQuestion'
import { FooterSlim } from 'common/FooterSlim'
import { HeaderSlim } from 'common/HeaderSlim'

export default function Error() {
  return (
    <div className="flex h-screen flex-col">
      <HeaderSlim />
      <div className="flex h-full flex-col items-center justify-center gap-24 text-light-0">
        <div className="text-4xl">Page not found!</div>
        <div className="scale-[2]">
          <GlyphQuestion />
        </div>
        <div className="text-lg text-medium-4">
          Click{' '}
          <a className="text-blue-500" href="/">
            here
          </a>{' '}
          to return back to safety
        </div>
      </div>
      <FooterSlim />
    </div>
  )
}
