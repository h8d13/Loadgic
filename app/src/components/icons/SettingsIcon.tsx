import { Icon, IconProps } from './Icon'

export default function SettingsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <svg viewBox="0 0 32 32" fill="none">
        <path
          d="M13.5 3H18.5L19.3 6.2C20.2 6.6 21 7.1 21.7 7.7L24.9 6.7L27.4 11.1L25 13.2C25.1 14 25.1 14.9 25 15.7L27.4 17.8L24.9 22.2L21.7 21.2C21 21.8 20.2 22.3 19.3 22.7L18.5 26H13.5L12.7 22.7C11.8 22.3 11 21.8 10.3 21.2L7.1 22.2L4.6 17.8L7 15.7C6.9 14.9 6.9 14 7 13.2L4.6 11.1L7.1 6.7L10.3 7.7C11 7.1 11.8 6.6 12.7 6.2L13.5 3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle
          cx="16"
          cy="16"
          r="4"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    </Icon>
  )
}
