import { useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

export interface MultiSelectOption {
  value: string
  label: string
  sublabel?: string
  avatar?: string | null
  avatarThumbnail?: string | null
}

interface MultiSelectProps {
  value: string[]
  onChange: (value: string[]) => void
  options: MultiSelectOption[]
  disabled?: boolean
  placeholder?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MultiSelect = ({
  value,
  onChange,
  options,
  disabled = false,
  placeholder = 'Select...',
  open,
  onOpenChange,
}: MultiSelectProps) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOpenChange(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onOpenChange])

  const toggle = (optionValue: string) => {
    onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue])
  }

  const selectedOptions = options.filter((o) => value.includes(o.value))

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && onOpenChange(!open)}
        disabled={disabled}
        style={{
          width: '100%',
          minHeight: '36px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '4px',
          padding: '4px 8px',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          background: 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          opacity: disabled ? 0.5 : 1,
          outline: 'none',
        }}
      >
        <span style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
          {selectedOptions.length === 0 ? (
            <span style={{ color: '#94a3b8' }}>{placeholder}</span>
          ) : (
            selectedOptions.map((opt) => (
              <Chip
                key={opt.value}
                option={opt}
                onRemove={(e) => {
                  e.stopPropagation()
                  toggle(opt.value)
                }}
              />
            ))
          )}
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

      {/* Dropdown */}
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
            maxHeight: '220px',
            overflowY: 'auto',
          }}
        >
          {options.length === 0 ? (
            <div style={{ padding: '10px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>
              No options found
            </div>
          ) : (
            options.map((option) => {
              const isSelected = value.includes(option.value)
              return (
                <OptionRow
                  key={option.value}
                  option={option}
                  isSelected={isSelected}
                  onToggle={() => toggle(option.value)}
                />
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

const Chip = ({
  option,
  onRemove,
}: {
  option: MultiSelectOption
  onRemove: (e: React.MouseEvent) => void
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      background: '#f1f5f9',
      border: '1px solid #e2e8f0',
      borderRadius: '4px',
      padding: '1px 6px',
      fontSize: '12px',
      fontWeight: 500,
      color: '#0f172a',
    }}
  >
    <Avatar src={option.avatarThumbnail ?? option.avatar} name={option.label} size={16} />
    {option.label}
    <span
      role="button"
      onClick={onRemove}
      style={{ cursor: 'pointer', color: '#94a3b8', lineHeight: 1, fontSize: '14px' }}
    >
      ×
    </span>
  </span>
)

const OptionRow = ({
  option,
  isSelected,
  onToggle,
}: {
  option: MultiSelectOption
  isSelected: boolean
  onToggle: () => void
}) => (
  <div
    onClick={onToggle}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 10px',
      cursor: 'pointer',
      fontSize: '13px',
      background: isSelected ? '#f8fafc' : 'transparent',
    }}
    onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = '#f1f5f9')}
    onMouseLeave={(e) =>
      ((e.currentTarget as HTMLDivElement).style.background = isSelected ? '#f8fafc' : 'transparent')
    }
  >
    {/* Checkbox */}
    <span
      style={{
        width: '16px',
        height: '16px',
        borderRadius: '3px',
        border: isSelected ? '2px solid #0f172a' : '2px solid #cbd5e1',
        background: isSelected ? '#0f172a' : 'white',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'background 0.1s, border-color 0.1s',
      }}
    >
      {isSelected && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M2 5l2.5 2.5L8 3"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>

    <Avatar src={option.avatarThumbnail ?? option.avatar} name={option.label} size={22} />

    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, overflow: 'hidden' }}>
      <span style={{ fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {option.label}
      </span>
      {option.sublabel && (
        <span style={{ fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {option.sublabel}
        </span>
      )}
    </div>
  </div>
)

const Avatar = ({ src, name, size }: { src?: string | null; name: string; size: number }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#e2e8f0',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.48,
        fontWeight: 700,
        color: '#475569',
        flexShrink: 0,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

export default MultiSelect
