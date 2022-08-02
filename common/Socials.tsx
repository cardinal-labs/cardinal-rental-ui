import {
  FaDiscord,
  FaGithub,
  FaGlobe,
  FaMedium,
  FaTwitter,
} from 'react-icons/fa'

export type IconKey = 'discord' | 'twitter' | 'github' | 'medium' | 'web'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  iconKey: IconKey
}

export const SocialIcon: React.FC<Props> = ({ iconKey }: Props) =>
  ({
    discord: <FaDiscord />,
    github: <FaGithub />,
    medium: <FaMedium />,
    twitter: <FaTwitter />,
    web: <FaGlobe />,
  }[iconKey])
