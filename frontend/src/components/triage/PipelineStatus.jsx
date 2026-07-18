import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock3,
  Activity,
} from "lucide-react";

export default function PipelineStatus({
  alerts = [],
  activities = [],
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
      {/* Recent Alerts */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-red-500" size={20} />
            <h2 className="font-semibold text-gray-800">
              Recent Alerts
            </h2>
          </div>

          <span className="text-xs text-gray-500">
            {alerts.length} Alerts
          </span>
        </div>

        <div className="max-h-80 overflow-y-auto">

          {alerts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No alerts available
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="px-5 py-4 border-b last:border-0 hover:bg-red-50 transition"
              >
                <div className="flex justify-between items-start">

                  <div className="flex gap-3">

                    <div className="mt-1">
                      <AlertTriangle
                        className="text-red-500"
                        size={18}
                      />
                    </div>

                    <div>

                      <p className="font-semibold text-gray-800">
                        {alert.title}
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        {alert.message}
                      </p>

                    </div>

                  </div>

                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {alert.time}
                  </span>

                </div>
              </div>
            ))
          )}

        </div>
      </div>

      {/* Recent Activity */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">

          <div className="flex items-center gap-2">
            <Activity className="text-blue-600" size={20} />
            <h2 className="font-semibold text-gray-800">
              Recent Activity
            </h2>
          </div>

          <span className="text-xs text-gray-500">
            Live Feed
          </span>

        </div>

        <div className="max-h-80 overflow-y-auto">

          {activities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No recent activity
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="px-5 py-4 border-b last:border-0 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between">

                  <div className="flex gap-3">

                    <div className="mt-1">
                      {activity.status === "SUCCESS" ? (
                        <CheckCircle2
                          className="text-green-500"
                          size={18}
                        />
                      ) : (
                        <Clock3
                          className="text-yellow-500"
                          size={18}
                        />
                      )}
                    </div>

                    <div>

                      <p className="font-semibold text-gray-800">
                        {activity.title}
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        {activity.description}
                      </p>

                    </div>

                  </div>

                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {activity.time}
                  </span>

                </div>
              </div>
            ))
          )}

        </div>
      </div>
    </div>
  );
}