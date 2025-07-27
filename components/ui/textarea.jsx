import React from "react"

export const Textarea = React.forwardRef(({ className = "", ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`w-full px-4 py-2 rounded-md border border-gray-600 bg-[#2E2C5A] text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E53FF] ${className}`}
      {...props}
    />
  )
})

Textarea.displayName = "Textarea"