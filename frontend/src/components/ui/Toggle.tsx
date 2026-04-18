interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-8 h-4 rounded-full transition-colors ${checked ? 'bg-white' : 'bg-gray-700'}`}
      >
        <span
          className={`absolute top-0.5 w-3 h-3 bg-black rounded-full transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </div>
      {label && <span className="text-sm text-gray-400">{label}</span>}
    </label>
  );
}
