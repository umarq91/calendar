import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[2px] border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // primary: ink-black bg / paper-white text → on hover invert to electric-blue bg / pure-white text
        default:
          "bg-[var(--color-ink-black)] text-[var(--color-paper-white)] hover:bg-[var(--color-electric-blue)] hover:text-[var(--color-pure-white)] aria-expanded:bg-[var(--color-electric-blue)] aria-expanded:text-[var(--color-pure-white)]",
        // outline: ghost-like base → on hover invert to ink-black bg / paper-white text
        outline:
          "border-[var(--color-ink-black)] bg-transparent text-[var(--color-ink-black)] hover:bg-[var(--color-ink-black)] hover:text-[var(--color-paper-white)] aria-expanded:bg-[var(--color-ink-black)] aria-expanded:text-[var(--color-paper-white)]",
        secondary:
          "bg-[var(--color-gray-100)] text-[var(--color-ink-black)] hover:bg-[var(--color-ink-black)] hover:text-[var(--color-paper-white)] aria-expanded:bg-[var(--color-ink-black)] aria-expanded:text-[var(--color-paper-white)]",
        // ghost: transparent → on hover, light surface keeps dark text; dark surface keeps light text via inheritance
        ghost:
          "bg-transparent hover:bg-[var(--color-gray-100)] hover:text-[var(--color-ink-black)] aria-expanded:bg-[var(--color-gray-100)] aria-expanded:text-[var(--color-ink-black)] dark:hover:bg-[var(--color-gray-900)] dark:hover:text-[var(--color-paper-white)]",
        // destructive: blue accent ↔ on hover invert to solid blue bg / white text
        destructive:
          "bg-transparent text-[var(--color-electric-blue)] hover:bg-[var(--color-electric-blue)] hover:text-[var(--color-pure-white)] focus-visible:border-[var(--color-electric-blue)] focus-visible:ring-[var(--color-electric-blue)]/30",
        link: "bg-transparent text-[var(--color-electric-blue)] underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[2px] px-2 text-xs in-data-[slot=button-group]:rounded-[2px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[2px] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-[2px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[2px] in-data-[slot=button-group]:rounded-[2px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[2px] in-data-[slot=button-group]:rounded-[2px]",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
