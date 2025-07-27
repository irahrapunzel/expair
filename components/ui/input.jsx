export function Input({ className, ...props }) {
  return (
    <input
      {...props}
      className={`w-[400px] h-[50px] rounded-[15px] border border-white/40 bg-[#120A2A] text-white px-3 py-2 focus:outline-none focus:border-blue-500 appearance-none ${className}`}
    />
  );
}