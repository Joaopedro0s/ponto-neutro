import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

// Estilo único de campo (input, select, textarea): nível 2 de superfície, borda com 3:1, foco laranja.
export const fieldClass =
  "w-full min-w-0 rounded-lg border border-input bg-surface-2 px-3 text-base text-foreground transition-colors duration-150 outline-none placeholder:text-muted-foreground hover:border-muted-foreground focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger sm:text-sm"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <InputPrimitive type={type} data-slot="input" className={cn(fieldClass, "h-11 sm:h-10 [color-scheme:dark]", className)} {...props} />
}

export { Input }
