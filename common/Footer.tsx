import { FaDiscord, FaGithub, FaMedium, FaTwitter } from 'react-icons/fa'
import { LogoTitled } from 'rental-components/common/LogoTitled'

export const SOCIALS = {
  discord: { icon: <FaDiscord />, link: 'https://discord.gg/byq6uNTugq' },
  github: { icon: <FaGithub />, link: 'https://github.com/cardinal-labs' },
  medium: { icon: <FaMedium />, link: 'https://cardinal-labs.medium.com/' },
  twitter: { icon: <FaTwitter />, link: 'https://twitter.com/cardinal_labs' },
}

export const Footer = ({
  accentColor = '#FFFFFF',
}: {
  accentColor?: string
}) => {
  return (
    <div className="mt-10 bg-white bg-opacity-5 px-10 pt-5 shadow-2xl md:px-32">
      <div className="flex w-full flex-wrap items-start justify-between gap-10 py-10">
        <div className="flex items-center">
          <LogoTitled className="inline-block h-6" />
          {/* 
          <img
            alt="Cardinal logo"
            className="inline-block h-[28px]"
            src="/cardinal-crosshair.svg"
          />
          <span className="ml-3 text-2xl font-semibold text-white">
            Cardinal
          </span> */}
        </div>
        <div className="flex gap-10 self-end text-center md:gap-20">
          <span className="flex flex-col items-start gap-1">
            <div className="mb-2 text-lg font-semibold text-white">
              Resources
            </div>
            <a href="https://docs.cardinal.so/" className="text-gray-400">
              Documentation
            </a>
            <a
              href="https://github.com/cardinal-labs"
              className="text-gray-400"
            >
              Github
            </a>
            <a href="mailto:team@cardinal.so" className="text-gray-400">
              Contact
            </a>
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border py-8 text-sm text-gray-400">
        <div className="flex items-center justify-center gap-2 text-gray-400">
          Powered by Cardinal
        </div>
        <div className="flex gap-4 text-gray-200">
          {Object.entries(SOCIALS).map(([id, { icon, link }]) => {
            return (
              <a
                key={id}
                href={link}
                target="_blank"
                rel="noreferrer"
                style={{ color: accentColor }}
                className={`opacity-80 transition-opacity hover:text-primary hover:opacity-100`}
              >
                {icon}
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
