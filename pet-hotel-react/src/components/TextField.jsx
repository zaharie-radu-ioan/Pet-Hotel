export default function TextField({
  id,
  label,
  type = "text",
  icon,
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
}) {
  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="input-row">
        {icon && (
          <span className="icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
      </div>
      <small className="error">{error || ""}</small>
    </div>
  );
}
