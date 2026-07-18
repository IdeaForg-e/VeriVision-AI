import { Loader2 } from "lucide-react";

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  className = "",
}) {
  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 border border-blue-600",

    secondary:
      "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100",

    danger:
      "bg-red-600 text-white hover:bg-red-700 border border-red-600",

    success:
      "bg-green-600 text-white hover:bg-green-700 border border-green-600",

    ghost:
      "bg-transparent text-gray-700 hover:bg-gray-100",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",

    md: "px-4 py-2 text-sm",

    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-lg
        font-medium
        transition-all
        duration-200
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        icon
      )}

      {children}
    </button>
  );
}