import * as React from "react"

export interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={() => onOpenChange?.(false)}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Dialog content container */}
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export interface DialogContentProps {
  className?: string
  children?: React.ReactNode
}

export function DialogContent({ className = "", children }: DialogContentProps) {
  return (
    <div
      className={`relative bg-gray-900 rounded-xl p-6 shadow-2xl max-w-lg w-full mx-4 ${className}`}
    >
      {children}
    </div>
  )
}

export interface DialogHeaderProps {
  className?: string
  children?: React.ReactNode
}

export function DialogHeader({ className = "", children }: DialogHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  )
}

export interface DialogTitleProps {
  className?: string
  children?: React.ReactNode
}

export function DialogTitle({ className = "", children }: DialogTitleProps) {
  return (
    <h2 className={`text-xl font-semibold ${className}`}>
      {children}
    </h2>
  )
}
