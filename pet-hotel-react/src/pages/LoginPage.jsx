import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { ApiError } from "../api/client";
import SplitLayout from "../components/SplitLayout";
import TextField from "../components/TextField";
import PasswordField from "../components/PasswordField";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = location.state?.registered === true;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next = {};
    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Please enter a valid email.";
    }
    if (!password) {
      next.password = "Password is required.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Ceva n-a mers. Incearca din nou."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SplitLayout
      heroTitle="Log in to name him"
      heroSubtitle="Booking a hotel for your companion becomes easier."
    >
      <h1>Log in</h1>
      <p className="intro">
        If you do not have an account register.
        <br />
        You can <Link to="/signup">Register here!</Link>
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {justRegistered && (
          <p className="success-message">Cont creat. Autentifica-te.</p>
        )}

        <TextField
          id="email"
          label="Email"
          type="email"
          icon={"\u2709"}
          value={email}
          onChange={setEmail}
          placeholder="Enter your email address"
          autoComplete="email"
          error={errors.email}
        />

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your Password"
          autoComplete="current-password"
          error={errors.password}
        />

        <button className="register-button" type="submit" disabled={submitting}>
          {submitting ? "Se conecteaza..." : "Log in"}
        </button>

        {formError && <p className="form-error">{formError}</p>}
      </form>
    </SplitLayout>
  );
}
