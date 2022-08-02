import styled from '@emotion/styled'
import { transparentize } from 'polished'

type BkgProps = {
  dark?: boolean
  colors?: { glow: string }
}

export const StyledBackground = styled.div<BkgProps>`
  z-index: -1;
  top: 0;
  width: 100%;
  height: 100%;
  position: fixed;
  background: ${(props) =>
    props.colors
      ? `linear-gradient(-45deg, ${transparentize(
          0.8,
          props.colors.glow
        )}, #0B0B0B, ${transparentize(0.8, props.colors.glow)})`
      : props.dark
      ? 'linear-gradient(-45deg, #200028, #000000, #002e38)'
      : 'linear-gradient(-45deg, #ee7752, #e7cae4, #23a6d5, #23d5ab)'};
  // background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 200% 200%;
  animation: gradient 10s ease infinite;
  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`

export const StyledBackgroundStatic = styled.div<{ dark?: boolean }>`
  z-index: -1;
  top: 0;
  width: 100%;
  height: 100%;
  position: fixed;
  background: ${(props) =>
    props.dark
      ? 'linear-gradient(-45deg, #200028, #000000, #002e38)'
      : 'linear-gradient(-45deg, #ee7752, #e7cae4, #23a6d5, #23d5ab)'};
  // background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 100% 100%;
`
