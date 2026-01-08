export interface IconProps {
  size?: number
  className?: string
}

export function Icon({
  size = 20,
  className,
  children,
}: React.PropsWithChildren<IconProps>) {
  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
      }}
    >
      {children}
    </span>
  )
}
