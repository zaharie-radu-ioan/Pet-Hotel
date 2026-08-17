import { useEffect, useMemo, useState } from "react";
import BrandLink from "../components/BrandLink";
import AccountMenu from "../components/AccountMenu";
import EmployeeTaskCard from "../components/EmployeeTaskCard";
import { ApiError } from "../api/client";
import { listMyActivities, updateActivityStatus } from "../api/activitati";
import "./EmployeeDashboard.css";

const COLUMNS = [
  { status: "planificata", title: "Planned" },
  { status: "in_curs", title: "In Progress" },
  { status: "finalizata", title: "Completed" },
];

function deadlineOf(activity) {
  return activity.ora_final ?? activity.ora_inceput;
}

export default function EmployeeDashboard() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  async function loadActivities() {
    try {
      setLoading(true);
      setError("");

      const data = await listMyActivities();

      setActivities(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "We couldn't load your tasks."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActivities();
  }, []);

  async function handleStatusChange(idActivitate, status) {
    try {
      setError("");
      setUpdatingId(idActivitate);

      await updateActivityStatus(idActivitate, status);

      await loadActivities();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "We couldn't update the task status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const columns = useMemo(() => {
    return COLUMNS.map((col) => ({
      ...col,
      items: activities
        .filter((a) => a.status === col.status)
        .sort(
          (a, b) => new Date(deadlineOf(a)) - new Date(deadlineOf(b))
        ),
    }));
  }, [activities]);

  return (
    <div className="employee-dashboard">

      <header className="home-nav">
        <BrandLink className="home-brand" />
        <nav className="home-nav-links">
          <AccountMenu variant="dark" />
        </nav>
      </header>

      <main className="employee-dashboard-body">

        <section className="employee-dashboard-heading">
          <h1>My Tasks</h1>
          <p>The activities assigned to you.</p>
        </section>

        {loading && (
          <div className="employee-dashboard-message">
            Loading tasks...
          </div>
        )}

        {error && (
          <div className="employee-dashboard-error">
            {error}
          </div>
        )}

        {!loading && !error && activities.length === 0 && (
          <div className="employee-dashboard-message">
            <h2>No tasks assigned</h2>
            <p>There are currently no activities assigned to your account.</p>
          </div>
        )}

        {!loading && activities.length > 0 && (
          <section className="employee-task-board">
            {columns.map((col) => (
              <div className="employee-task-column" key={col.status}>
                <div className="employee-task-column-header">
                  <h2>{col.title}</h2>
                  <span className="employee-task-count">{col.items.length}</span>
                </div>

                <div className="employee-task-column-body">
                  {col.items.length === 0 && (
                    <p className="employee-task-column-empty">No tasks here.</p>
                  )}

                  {col.items.map((activity) => (
                    <EmployeeTaskCard
                      key={activity.id_activitate}
                      activity={activity}
                      updating={updatingId === activity.id_activitate}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

      </main>
    </div>
  );
}