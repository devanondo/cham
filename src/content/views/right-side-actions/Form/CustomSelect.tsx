import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectGroup {
  label: string
  options: SelectOption[]
}

interface CustomSelectProps {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  options?: SelectOption[]
  groups?: SelectGroup[]
  emptyMessage?: string
}

const CustomSelect = ({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select...',
  options = [],
  groups = [],
  emptyMessage = 'No options found',
}: CustomSelectProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const allOptions = groups.length > 0 ? groups.flatMap((g) => g.options) : options
  const selectedLabel = allOptions.find((o) => o.value === value)?.label
  const isEmpty = allOptions.length === 0

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue)
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => !disabled && !isEmpty && setOpen((o) => !o)}
        disabled={disabled || isEmpty}
        style={{
          width: '100%',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 10px',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          background: 'white',
          cursor: disabled || isEmpty ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          opacity: disabled || isEmpty ? 0.5 : 1,
          outline: 'none',
          gap: '6px',
        }}
      >
        <span
          style={{
            color: selectedLabel ? '#0f172a' : '#94a3b8',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            textAlign: 'left',
          }}
        >
          {selectedLabel ?? placeholder}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: '#94a3b8',
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 2147483648,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {groups.length > 0 ? (
            groups.map((group) =>
              group.options.length > 0 ? (
                <div key={group.label}>
                  <div
                    style={{
                      padding: '6px 10px 2px',
                      fontSize: '11px',
                      color: '#94a3b8',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {group.label}
                  </div>
                  {group.options.map((option) => (
                    <OptionRow
                      key={option.value}
                      option={option}
                      isSelected={option.value === value}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              ) : null
            )
          ) : options.length > 0 ? (
            options.map((option) => (
              <OptionRow
                key={option.value}
                option={option}
                isSelected={option.value === value}
                onSelect={handleSelect}
              />
            ))
          ) : (
            <div style={{ padding: '10px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>
              {emptyMessage}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const OptionRow = ({
  option,
  isSelected,
  onSelect,
}: {
  option: SelectOption
  isSelected: boolean
  onSelect: (value: string) => void
}) => (
  <div
    onClick={() => onSelect(option.value)}
    style={{
      padding: '8px 12px',
      cursor: 'pointer',
      fontSize: '13px',
      background: isSelected ? '#f1f5f9' : 'transparent',
      fontWeight: isSelected ? 500 : 400,
      color: '#0f172a',
    }}
    onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = '#f1f5f9')}
    onMouseLeave={(e) =>
      ((e.currentTarget as HTMLDivElement).style.background = isSelected ? '#f1f5f9' : 'transparent')
    }
  >
    {option.label}
  </div>
)

export default CustomSelect
