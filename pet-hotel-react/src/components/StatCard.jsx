export default function StatCard({ title, value, description }) {
    return (
        <div className="bi-stat-card">
            <div className="bi-stat-title">
                {title}
            </div>

            <div className="bi-stat-value">
                {value}
            </div>

            {description && (
                <div className="bi-stat-description">
                    {description}
                </div>
            )}
        </div>
    );
}