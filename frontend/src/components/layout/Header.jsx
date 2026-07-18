import { NavLink } from "react-router-dom";
import {
  Bell,
  Camera,
  Search,
  Settings,
  User,
} from "lucide-react";
import { ROUTES } from "../../utils/constants.js";

const NAV_LINKS = [
  { to: ROUTES.LOGIN,        label: "Login" },
  { to: ROUTES.TRIAGE,       label: "Daily Triage" },
  { to: ROUTES.CASE_DETAIL,  label: "Case Detail" },
  { to: ROUTES.HUMAN_REVIEW, label: "Human Review" },
  { to: ROUTES.FEEDBACK,     label: "Feedback Panel" },
];

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Left */}

        <div className="flex items-center gap-8">

          {/* Logo */}

          <NavLink to={ROUTES.TRIAGE} className="flex items-center gap-2">

            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              FG
            </div>

            <div>

              <h1 className="font-bold text-lg">
                FraudGuard
              </h1>

              <p className="text-xs text-gray-500">
                AI Inspection
              </p>

            </div>

          </NavLink>

          {/* Search */}

          <div className="relative hidden lg:block">

            <Search
              size={18}
              className="absolute left-3 top-3 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search..."
              className="
                w-72
                pl-10
                pr-4
                py-2
                rounded-lg
                border
                border-gray-300
                focus:outline-none
                focus:ring-2
                focus:ring-blue-100
              "
            />

          </div>

        </div>

        {/* Center Navigation */}

        <nav className="hidden xl:flex items-center gap-6 text-sm font-medium">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600 transition-colors"
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right */}

        <div className="flex items-center gap-3">

          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">

            <Camera size={18} />

            Capture Image

          </button>

          <button className="p-2 rounded-lg hover:bg-gray-100">

            <Bell size={20} />

          </button>

          <button className="p-2 rounded-lg hover:bg-gray-100">

            <Settings size={20} />

          </button>

          <button className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">

            <User size={18} />

          </button>

        </div>

      </div>

    </header>
  );
}