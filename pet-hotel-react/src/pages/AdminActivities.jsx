import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { ApiError } from "../api/client";
import { listAllActivities } from "../api/adminActivitati";
import "./AdminActivities.css";

export default function AdminActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    try {
      setLoading(true);
      setError("");

      const data = await listAllActivities();
      setActivities(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "We couldn't load the activities."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-page">
      <AppHeader />

      <main className="admin-page-body">

        <div className="admin-activities-header">
          <div>
            <Link to="/admin" className="back-link">
              ← Back to Admin
            </Link>

            <h1>Hotel Activities</h1>

            <p className="muted-text">
              View and manage all activities assigned to hotel employees.
            </p>
          </div>
        </div>

        {loading && (
          <p className="muted-text">
            Loading activities...
          </p>
        )}

        {error && (
          <p className="error-text">
            {error}
          </p>
        )}

        {!loading && !error && activities.length === 0 && (
          <div className="activity-empty-card">
            <h2>No activities found</h2>

            <p className="muted-text">
              There are currently no activities in the system.
            </p>
          </div>
        )}

        {!loading && !error && activities.length > 0 && (
          <div className="activities-table-wrapper">
            <table className="activities-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Animal</th>
                  <th>Room</th>
                  <th>Employee</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id_activitate}>

                    <td>
                      <strong>
                        {activity.tip_activitate}
                      </strong>

                      {activity.observatii && (
                        <small>
                          {activity.observatii}
                        </small>
                      )}
                    </td>

                    <td>
                      {activity.animal
                        ? activity.animal.nume
                        : "—"}
                    </td>

                    <td>
                      {activity.camera
                        ? activity.camera.tip_camera
                        : "—"}
                    </td>

                    <td>
                      {activity.angajat
                        ? `${activity.angajat.prenume} ${activity.angajat.nume}`
                        : "Unassigned"}
                    </td>

                    <td>
                      {formatDateTime(activity.ora_inceput)}
                    </td>

                    <td>
                      {activity.ora_final
                        ? formatDateTime(activity.ora_final)
                        : "—"}
                    </td>

                    <td>
                      <span
                        className={`activity-status activity-status-${activity.status}`}
                      >
                        {formatStatus(activity.status)}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function formatStatus(status) {
  const labels = {
    planificata: "Planned",
    in_curs: "In progress",
    finalizata: "Completed",
    anulata: "Cancelled",
  };

  return labels[status] || status;
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}