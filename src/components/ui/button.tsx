import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Alturas: 44px no celular (alvo de toque), mais compactas a partir de 640px.
const variants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 ease-snappy outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-danger [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[color-mix(in_oklab,var(--primary),white_12%)]",
        outline: "border-input bg-transparent text-foreground hover:border-muted-foreground hover:bg-surface-2",
        secondary: "bg-surface-2 text-foreground hover:bg-[color-mix(in_oklab,var(--surface-2),white_6%)]",
        ghost: "text-muted-foreground hover:bg-surface-2 hover:text-foreground aria-expanded:bg-surface-2 aria-expanded:text-foreground",
        destructive: "bg-danger-soft text-danger-fg hover:bg-[color-mix(in_oklab,var(--danger),var(--surface)_70%)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-3.5 sm:h-9",
        xs: "h-8 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-10 px-3 sm:h-8",
        lg: "h-11 px-4 sm:h-10",
        icon: "size-11 sm:size-9",
        "icon-xs": "size-8 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-10 sm:size-8",
        "icon-lg": "size-11 sm:size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

// Sempre com merge: em links (<Link className={buttonVariants(...)}>) a cor de borda da variante precisa vencer a base.
const buttonVariants = (props?: Parameters<typeof variants>[0]) => cn(variants(props))

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof variants>) {
  return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
