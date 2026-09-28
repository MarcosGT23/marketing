export function Checkbox({ label, checked, onChange, id, className = '', ...props }) {
    const checkId = id || (label ? `check-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
        <label
            htmlFor={checkId}
            className={`flex items-center gap-2.5 cursor-pointer select-none group ${className}`}
        >
            <div className="relative flex-shrink-0">
                <input
                    id={checkId}
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="sr-only"
                    {...props}
                />
                <div
                    className="w-4 h-4 rounded transition-all duration-150 flex items-center justify-center"
                    style={{
                        background: checked ? 'var(--color-primary-container)' : 'var(--color-surface)',
                        border: checked ? '1.5px solid var(--color-primary-container)' : '1.5px solid var(--color-outline-variant)',
                        boxShadow: checked ? '0 0 0 0 transparent' : 'none',
                    }}
                    onClick={() => {
                        const input = document.getElementById(checkId);
                        if (input) input.click();
                    }}
                >
                    {checked && (
                        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </div>
            </div>
            {label && (
                <span
                    className="font-body-md transition-colors"
                    style={{ color: 'var(--color-on-surface)' }}
                >
                    {label}
                </span>
            )}
        </label>
    );
}

export default Checkbox;
