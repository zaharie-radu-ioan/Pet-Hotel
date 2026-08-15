import { Link } from "react-router-dom";

// "Pet Hotel" brand as a link to the landing page. className carries the
// context styling; we only reset the link look.
export default function BrandLink({ className = "" }) {
  return (
    <Link
      to="/"
      className={className}
      style={{ color: "inherit", textDecoration: "none" }}
    >
      <span aria-hidden="true">{"\u{1F43E}"}</span> Pet Hotel
    </Link>
  );
}
