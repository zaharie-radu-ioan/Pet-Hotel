function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EmployeeTaskCard({
  activity,
  onStatusChange,
  updating,
}) {
  const isFinal = activity.status === "finalizata";

  return (
    <article className="employee-task-card">
      <div className="employee-task-details">
        
        <div>
          <span className="employee-task-label">Activity Type</span>
          <strong>{activity.tip_activitate ?? "-"}</strong>
        </div>

        <div>
          <span className="employee-task-label">Animal</span>
          <strong>{activity.animal?.nume ?? "-"}</strong>
        </div>

        <div>
          <span className="employee-task-label">Room</span>
          <strong>
            {activity.camera?.tip_camera ?? "-"} (#{activity.camera?.id_camera ?? "-"})
          </strong>
        </div>

        <div>
          <span className="employee-task-label">Start</span>
          <strong>{formatDateTime(activity.ora_inceput)}</strong>
        </div>

        <div>
          <span className="employee-task-label">End</span>
          <strong>{formatDateTime(activity.ora_final)}</strong>
        </div>
      </div>

      <p className="employee-task-description">
        {activity.observatii || "No description added."}
      </p>

      {!isFinal && (
        <div className="employee-task-move">
          <select
            className="employee-task-select"
            value=""
            disabled={updating}
            onChange={(e) => {
              const status = e.target.value;
              if (status) {
                onStatusChange(activity.id_activitate, status);
              }
              e.target.value = "";
            }}
          >
            <option value="" disabled>
              {updating ? "Updating..." : "Move to..."}
            </option>
            <option value="in_curs">In Progress</option>
            <option value="finalizata">Completed</option>
          </select>
        </div>
      )}
    </article>
  );
}