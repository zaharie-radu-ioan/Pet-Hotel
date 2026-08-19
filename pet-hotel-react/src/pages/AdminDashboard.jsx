import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { ApiError } from "../api/client";
import { listEmployees } from "../api/adminActivitati";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await listEmployees();
        setEmployees(data);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "We couldn't load the employees."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="admin-page">
      <AppHeader />
      <main className="admin-page-body">
        <h1>Employees</h1>
        <p className="muted-text">
          Select an employee to view and manage their assigned tasks.
        </p>

        {loading && <p className="muted-text">Loading employees...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && !error && employees.length === 0 && (
          <div className="card" style={{ marginTop: "20px" }}>
            <h2>No employees found</h2>
            <p className="muted-text">There are no active employee accounts yet.</p>
          </div>
        )}

        {!loading && employees.length > 0 && (
          <div className="employee-grid">
            {employees.map((emp) => (
              <Link
                to={`/admin/employees/${emp.id_angajat}`}
                className="employee-card"
                key={emp.id_angajat}
              >
                <div className="employee-avatar" aria-hidden="true">
                  {emp.nume?.[0]?.toUpperCase()}
                  {emp.prenume?.[0]?.toUpperCase()}
                </div>
                <h2>
                  {emp.prenume} {emp.nume}
                </h2>
                <p>{emp.telefon || "No phone number"}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}