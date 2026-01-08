import { Icon, IconProps } from './Icon'

export default function LogicIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <svg viewBox="0 0 32 32" fill="none">
        <path
          d="M6 6H14V14H6V6ZM18 6H26V14H18V6ZM6 18H14V26H6V18ZM18 18H26V26H18V18ZM14 10H18M10 14V18M14 22H18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Icon>
  )
}
