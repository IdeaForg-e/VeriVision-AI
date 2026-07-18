import { Search, X } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
}) {
  return (
    <div className="relative w-full">
      {/* Search Icon */}
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
      />

      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full
          rounded-xl
          border
          border-gray-300
          bg-white
          py-3
          pl-11
          pr-10
          text-sm
          text-gray-700
          placeholder:text-gray-400
          outline-none
          transition
          focus:border-blue-500
          focus:ring-2
          focus:ring-blue-100
        "
      />

      {/* Clear Button */}
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <X
            size={16}
            className="text-gray-400 hover:text-gray-700"
          />
        </button>
      )}
    </div>
  );
}