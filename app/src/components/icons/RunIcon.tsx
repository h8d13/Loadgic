import { Icon, IconProps } from './Icon'

export default function RunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <svg viewBox="0 0 32 32" fill="none">
        <path
          d="M6 4V28L26 16L6 4Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </Icon>
  )
}
