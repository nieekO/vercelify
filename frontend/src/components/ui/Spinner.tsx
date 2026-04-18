export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-block border-2 border-gray-700 border-t-white rounded-full animate-spin"
      style={{ width: size, height: size, flexShrink: 0 }}
    />
  );
}
