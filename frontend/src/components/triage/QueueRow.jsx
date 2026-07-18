import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { ROUTES } from "../../utils/constants.js";

export default function QueueRow({ item }) {
  const navigate = useNavigate();

  const getStatusStyle = (status) => {
    switch (status) {
      case "QUARANTINE":
        return "bg-red-100 text-red-700 border border-red-200";

      case "PENDING QA":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";

      case "AUTO-APPROVED":
        return "bg-green-100 text-green-700 border border-green-200";

      case "RETAKE REQUESTED":
        return "bg-blue-100 text-blue-700 border border-blue-200";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getRiskColor = (risk) => {
    if (risk >= 80) return "bg-red-500";
    if (risk >= 60) return "bg-orange-500";
    if (risk >= 40) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "QUARANTINE":
        return <AlertTriangle size={14} />;

      case "AUTO-APPROVED":
        return <CheckCircle2 size={14} />;

      default:
        return <Clock3 size={14} />;
    }
  };

  // Bug fix: was using item.id (numeric 1, 2, 3) instead of the real case ID string
  const handleClick = () => navigate(`${ROUTES.CASE_DETAIL}/${item.caseId}`);

  return (
    <tr
      onClick={handleClick}
      className="group cursor-pointer border-b last:border-b-0 hover:bg-blue-50 transition-all duration-200"
    >
      {/* Case ID */}

      <td className="px-6 py-4">

        <div>

          <p className="font-semibold text-gray-800">
            {item.caseId}
          </p>

          <p className="text-xs text-gray-400">
            {item.createdAt}
          </p>

        </div>

      </td>

      {/* Part */}

      <td className="px-4 py-4">

        <div>

          <p className="font-medium text-gray-700">
            {item.partNumber}
          </p>

          <p className="text-xs text-gray-400">
            {item.batch}
          </p>

        </div>

      </td>

      {/* Commodity */}

      <td className="px-4 py-4">
        {item.commodity}
      </td>

      {/* Risk */}

      <td className="px-4 py-4">

        <div className="space-y-2">

          <div className="flex justify-between text-xs">

            <span className="font-semibold">

              {item.riskScore}%

            </span>

            <span className="text-gray-400">

              Risk

            </span>

          </div>

          <div className="w-full h-2 rounded-full bg-gray-200">

            <div
              className={`h-2 rounded-full ${getRiskColor(
                item.riskScore
              )}`}
              style={{
                width: `${item.riskScore}%`,
              }}
            />

          </div>

        </div>

      </td>

      {/* Confidence */}

      <td className="px-4 py-4">

        <span className="font-semibold text-blue-600">

          {item.confidence}%

        </span>

      </td>

      {/* Reason */}

      <td className="px-4 py-4">

        <p className="text-sm text-gray-600">

          {item.reason}

        </p>

      </td>

      {/* Status */}

      <td className="px-4 py-4">

        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
            item.status
          )}`}
        >
          {getStatusIcon(item.status)}

          {item.status}

        </div>

      </td>

      {/* Arrow */}

      <td className="px-4 py-4">

        <ChevronRight
          className="text-gray-400 group-hover:text-blue-600 transition"
          size={18}
        />

      </td>
    </tr>
  );
}