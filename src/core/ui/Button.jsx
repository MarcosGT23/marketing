export function Button({
    children,
    type = 'button',
    variant = 'primary',
    size = 'medium',
    disabled = false,
    className = '',
    ...props
}) {
    const variants = {
        primary: {
            background: 'var(--color-primary-container)',
            color: 'var(--color-on-primary)',
            hoverBg: 'var(--color-primary)',
            shadow: '0 2px 8px rgba(37,99,235,0.2)',
        },
        secondary: {
            background: 'var(--color-surface-container)',
            color: 'var(--color-on-surface)',
            hoverBg: 'var(--color-surface-container-high)',
            shadow: '0 1px 4px rgba(0,0,0,0.06)',
        },
        outline: {
            background: 'transparent',
            color: 'var(--color-on-surface-variant)',
            border: '1px solid var(--color-outline-variant)',
            hoverBg: 'var(--color-surface-container-low)',
            shadow: 'none',
        },
        danger: {
            background: 'var(--color-error)',
            color: 'var(--color-on-error)',
            hoverBg: '#9b1515',
            shadow: '0 2px 8px rgba(186,26,26,0.2)',
        },
    };

    const sizes = {
        small:  { padding: '0.375rem 0.75rem', fontSize: '12px', borderRadius: '0.375rem' },
        medium: { padding: '0.5rem 1rem',      fontSize: '14px', borderRadius: '0.5rem'   },
        large:  { padding: '0.75rem 1.5rem',   fontSize: '15px', borderRadius: '0.5rem'   },
    };

    const v = variants[variant] || variants.primary;
    const s = sizes[size] || sizes.medium;

    return (
        <button
            type={type}
            disabled={disabled}
            className={`inline-flex items-center justify-center font-label-md font-medium transition-all duration-200 active:scale-[0.98] ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
            style={{
                background: v.background,
                color: v.color,
                boxShadow: v.shadow,
                border: v.border || 'none',
                padding: s.padding,
                fontSize: s.fontSize,
                borderRadius: s.borderRadius,
                fontWeight: 500,
            }}
            onMouseEnter={e => { if (!disabled && v.hoverBg) e.currentTarget.style.background = v.hoverBg; }}
            onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = v.background; }}
            {...props}
        >
            {children}
        </button>
    );
}

export default Button;
