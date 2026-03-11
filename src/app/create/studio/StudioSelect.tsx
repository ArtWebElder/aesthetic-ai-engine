import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface StudioSelectOption {
  value: string;
  label: string;
}

interface StudioSelectProps {
  value?: string;
  defaultValue?: string;
  options: StudioSelectOption[];
  onChange?: (value: string) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export function StudioSelect({
  value,
  defaultValue,
  options,
  onChange,
  onMouseDown,
}: StudioSelectProps) {
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? options[0]?.value ?? ''
  );
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const currentValue = controlled ? value! : internalValue;
  const selectedLabel =
    options.find(o => o.value === currentValue)?.label ?? options[0]?.label ?? '';

  useEffect(() => {
    if (!open) return;
    const handleOutside = () => setOpen(false);
    // Defer so the current click that opened it doesn't immediately close it
    const id = setTimeout(() => document.addEventListener('mousedown', handleOutside), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [open]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      setRect(btnRef.current.getBoundingClientRect());
    }
    setOpen(v => !v);
  };

  const handleSelect = (optValue: string) => {
    if (!controlled) setInternalValue(optValue);
    onChange?.(optValue);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }} onMouseDown={onMouseDown}>
      {/* Trigger */}
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: open ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.04)',
          border: `1px solid ${open ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}`,
          borderRadius: 7,
          padding: '0 8px',
          height: 28,
          fontSize: 11,
          color: '#111827',
          cursor: 'pointer',
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'border-color 0.12s, background 0.12s',
          boxSizing: 'border-box',
        }}
      >
        <span style={{
          flex: 1,
          textAlign: 'left',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {selectedLabel}
        </span>
        <ChevronDown
          size={10}
          style={{
            color: 'rgba(0,0,0,0.4)',
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        />
      </button>

      {/* Options list — rendered in a portal to escape overflow:hidden parents */}
      {open && rect && createPortal(
        <div
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: 8,
            padding: 3,
            zIndex: 99999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          {options.map(option => {
            const isSelected = option.value === currentValue;
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '6px 8px',
                  fontSize: 11,
                  color: isSelected ? '#ff713d' : 'rgba(0,0,0,0.8)',
                  background: isSelected ? 'rgba(255,113,61,0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: 5,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => {
                  if (!isSelected)
                    (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.05)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = isSelected
                    ? 'rgba(255,113,61,0.1)'
                    : 'transparent';
                }}
              >
                <span style={{ flex: 1 }}>{option.label}</span>
                {isSelected && (
                  <Check size={9} style={{ color: '#ff713d', flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
