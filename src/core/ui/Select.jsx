export function Select({ label, value, onChange, options = [], error, className = '', id, ...props }) {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const handleChange = (e) => {
        if (onChange) onChange(e.target.value);
    };

    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label
                    htmlFor={selectId}
                    className="font-label-sm"
                    style={{ color: 'var(--color-on-surface-variant)' }}
                >
                    {label}{props.required && <span style={{ color: 'var(--color-error)' }}> *</span>}
                </label>
            )}
            <div className="relative">
                <select
                    id={selectId}
                    value={value}
                    onChange={handleChange}
                    className={`w-full appearance-none px-3 py-2 pr-9 rounded-lg font-body-md cursor-pointer transition-all duration-150 outline-none ${className}`}
                    style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-outline-variant)',
                        color: 'var(--color-on-surface)',
                        fontSize: '14px',
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
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5" style={{ color: 'var(--color-outline)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            {error && (
                <span className="font-body-sm" style={{ color: 'var(--color-error)' }}>{error}</span>
            )}
        </div>
    );
}

export default Select;
