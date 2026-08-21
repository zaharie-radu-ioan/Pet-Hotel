import BrandLink from "./BrandLink";
import AccountMenu from "./AccountMenu";
import NotificationBell from "./NotificationBell";

// Shared header for the protected pages.
export default function AppHeader() {
  return (
    <header className="dashboard-header">
      <BrandLink className="brand" />

      <div className="header-actions">
        <NotificationBell />
        <AccountMenu />
      </div>
    </header>
  );
}