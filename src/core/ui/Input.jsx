export function Input({ label, error, className = '', id, ...props }) {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="font-label-sm"
                    style={{ color: 'var(--color-on-surface-variant)' }}
                >
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={`w-full px-3 py-2 rounded-lg font-body-md transition-all duration-150 outline-none focus:ring-2 ${className}`}
                style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-outline-variant)',
                    color: 'var(--color-on-surface)',
                    fontSize: '14px',
                    '--tw-ring-color': 'rgba(37,99,235,0.25)',
                }}
                onFocus={e => {
                    e.target.style.borderColor = 'var(--color-primary-container)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)';
                }}
                onBlur={e => {
                    e.target.style.borderColor = 'var(--color-outline-variant)';
                    e.target.style.boxShadow = 'none';
                }}
                {...props}
            />
            {error && (
                <span className="font-body-sm" style={{ color: 'var(--color-error)' }}>{error}</span>
            )}
        </div>
    );
}

export default Input;
