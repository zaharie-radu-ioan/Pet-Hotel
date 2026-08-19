import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import Task from "../components/Task";
import { ApiError } from "../api/client";
import {
  listEmployees,
  getEmployeeActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../api/adminActivitati";
import "./EmployeeTasksPage.css";

const STATUS_LABELS = {
  planificata: "Planned",
  in_curs: "In Progress",
  finalizata: "Completed",
  anulata: "Cancelled",
};

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EmployeeTasksPage() {
  const { id } = useParams();

  const [employee, setEmployee] = useState(null);
  const [activities, setActivities] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [movingTask, setMovingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [detail, allEmployees] = await Promise.all([
        getEmployeeActivities(id),
        listEmployees(),
      ]);

      setEmployee(detail.angajat);
      setActivities(detail.activitati);
      setEmployees(allEmployees);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "We couldn't load this employee's tasks."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleCreate(data) {
    try {
      setSaving(true);
      setFormError("");
      await createActivity(data);
      setShowCreate(false);
      await loadData();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "We couldn't create the task.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(data) {
    try {
      setSaving(true);
      setFormError("");
      await updateActivity(editingTask.id_activitate, data);
      setEditingTask(null);
      await loadData();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "We couldn't update the task.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMove(newEmployeeId) {
    if (!movingTask) return;

    try {
      setSaving(true);
      setFormError("");

      await updateActivity(movingTask.id_activitate, {
        tip_activitate: movingTask.tip_activitate,
        ora_inceput: movingTask.ora_inceput,
        ora_final: movingTask.ora_final,
        status: movingTask.status,
        observatii: movingTask.observatii,
        id_cazare: movingTask.id_cazare ?? null,
        id_angajat: Number(newEmployeeId),
      });

      setMovingTask(null);
      await loadData();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "We couldn't reassign the task.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!taskToDelete) return;

    try {
      setDeleting(true);
      setError("");
      await deleteActivity(taskToDelete.id_activitate);
      setTaskToDelete(null);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't delete the task.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="employee-tasks-page">
      <AppHeader />

      <main className="employee-tasks-page-body">
        <Link to="/admin" className="back-link">
           - Back to employees
        </Link>

        {loading && <p className="muted-text">Loading...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && !error && employee && (
          <>
            <div className="tasks-page-heading">
              <div>
                <h1>
                  {employee.prenume} {employee.nume}
                </h1>
                <p className="muted-text">{employee.telefon || "No phone number"}</p>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setFormError("");
                  setShowCreate(true);
                }}
              >
                + Create task
              </button>
            </div>

            {activities.length === 0 ? (
              <div className="card" style={{ marginTop: "20px" }}>
                <h2>No tasks assigned</h2>
                <p className="muted-text">This employee has no assigned tasks yet.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="tasks-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Animal</th>
                      <th>Room</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Status</th>
                      <th>Notes</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((task) => (
                      <tr key={task.id_activitate}>
                        <td>{task.tip_activitate}</td>
                        <td>{task.animal?.nume ?? "-"}</td>
                        <td>{task.camera?.id_camera ?? "-"}</td>
                        <td>{formatDateTime(task.ora_inceput)}</td>
                        <td>{formatDateTime(task.ora_final)}</td>
                        <td>
                          <span className={`task-status task-status--${task.status}`}>
                            {STATUS_LABELS[task.status] ?? task.status}
                          </span>
                        </td>
                        <td className="tasks-table-notes">{task.observatii || "-"}</td>
                        <td>
                          <div className="tasks-table-actions">
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => {
                                setFormError("");
                                setEditingTask(task);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => {
                                setFormError("");
                                setMovingTask(task);
                              }}
                            >
                              Move
                            </button>
                            <button
                              type="button"
                              className="btn-danger"
                              onClick={() => setTaskToDelete(task)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {showCreate && (
        <Task
          title="Create task"
          submitLabel="Create"
          employees={employees}
          initialValues={{ id_angajat: Number(id) }}
          showStatus={false}
          saving={saving}
          error={formError}
          onCancel={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}

      {editingTask && (
        <Task
          title="Edit task"
          submitLabel="Save changes"
          employees={employees}
          initialValues={editingTask}
          showStatus
          saving={saving}
          error={formError}
          onCancel={() => setEditingTask(null)}
          onSubmit={handleEdit}
        />
      )}

      {movingTask && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Move task</h2>
            <p className="muted-text">
              Reassign "{movingTask.tip_activitate}" to another employee.
            </p>

            <label className="field-label">
              Employee
              <select
                defaultValue=""
                onChange={(e) => e.target.value && handleMove(e.target.value)}
                disabled={saving}
              >
                <option value="" disabled>
                  {saving ? "Moving..." : "Select employee"}
                </option>
                {employees
                  .filter((emp) => emp.id_angajat !== movingTask.id_angajat)
                  .map((emp) => (
                    <option key={emp.id_angajat} value={emp.id_angajat}>
                      {emp.prenume} {emp.nume}
                    </option>
                  ))}
              </select>
            </label>

            {formError && <p className="form-error">{formError}</p>}

            <div className="profil-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setMovingTask(null)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {taskToDelete && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Delete task?</h2>
            <p>
              Are you sure you want to delete "<strong>{taskToDelete.tip_activitate}</strong>"?
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setTaskToDelete(null)}
                disabled={deleting}
              >
                No
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}