import * as React from "react"

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  children?: React.ReactNode
}

export interface SelectTriggerProps {
  children?: React.ReactNode
  className?: string
}

export interface SelectContentProps {
  children?: React.ReactNode
}

export interface SelectItemProps {
  value: string
  children?: React.ReactNode
}

export interface SelectValueProps {
  placeholder?: string
  value?: string
}

export const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children, placeholder }) => {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div className="relative">
        <SelectTrigger onClick={() => setIsOpen(!isOpen)}>
          {value || placeholder}
        </SelectTrigger>
        {isOpen && (
          <SelectContent>
            {children}
          </SelectContent>
        )}
      </div>
    </SelectContext.Provider>
  )
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className }) => {
  const { setIsOpen } = React.useContext(SelectContext)
  
  return (
    <div 
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
      onClick={() => setIsOpen?.(true)}
    >
      {children}
    </div>
  )
}

export const SelectContent: React.FC<SelectContentProps> = ({ children }) => {
  const { value, onValueChange } = React.useContext(SelectContext)
  
  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
      {children}
    </div>
  )
}

export const SelectItem: React.FC<SelectItemProps> = ({ value, children }) => {
  const { onValueChange } = React.useContext(SelectContext)
  
  return (
    <div 
      className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </div>
  )
}

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder, value }) => {
  return <span>{value || placeholder}</span>
}
