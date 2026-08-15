import BrandLink from "./BrandLink";
import AccountMenu from "./AccountMenu";

// Shared header for the protected pages.
export default function AppHeader() {
  return (
    <header className="dashboard-header">
      <BrandLink className="brand" />
      <AccountMenu />
    </header>
  );
}