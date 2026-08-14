import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/auth";
import { ApiError } from "../api/client";
import SplitLayout from "../components/SplitLayout";
import TextField from "../components/TextField";
import PasswordField from "../components/PasswordField";

const EMPTY = {
  email: "",
  prenume: "",
  nume: "",
  telefon: "",
  adresa: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (val) => setValues((v) => ({ ...v, [key]: val }));

  function validate() {
    const e = {};
    if (!values.email.trim()) {
      e.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      e.email = "Please enter a valid email.";
    }
    if (!values.prenume.trim()) e.prenume = "First name is required.";
    if (!values.nume.trim()) e.nume = "Last name is required.";
    if (values.password.length < 8) {
      e.password = "Password must contain at least 8 characters.";
    }
    if (!values.confirmPassword) {
      e.confirmPassword = "Please confirm your password.";
    } else if (values.password !== values.confirmPassword) {
      e.confirmPassword = "Passwords do not match.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register({
        email: values.email.trim(),
        password: values.password,
        nume: values.nume.trim(),
        prenume: values.prenume.trim(),
        telefon: values.telefon.trim() || null,
        adresa: values.adresa.trim() || null,
      });
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrors((prev) => ({
          ...prev,
          email: "Exista deja un cont cu acest email.",
        }));
      } else {
        setFormError(
          err instanceof ApiError ? err.message : "Ceva n-a mers. Incearca din nou."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SplitLayout
      heroTitle="Join and name him"
      heroSubtitle="Booking a hotel for your companion becomes easier."
    >
      <h1>Register</h1>
      <p className="intro">
        Already have an account?
        <br />
        You can <Link to="/login">Log in here!</Link>
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <TextField id="email" label="Email" type="email" icon={"\u2709"}
          value={values.email} onChange={set("email")}
          placeholder="Enter your email address" autoComplete="email" error={errors.email} />
        <TextField id="prenume" label="First name" icon={"\u{1F464}"}
          value={values.prenume} onChange={set("prenume")}
          placeholder="Enter your first name" autoComplete="given-name" error={errors.prenume} />
        <TextField id="nume" label="Last name" icon={"\u{1F464}"}
          value={values.nume} onChange={set("nume")}
          placeholder="Enter your last name" autoComplete="family-name" error={errors.nume} />
        <TextField id="telefon" label="Phone (optional)" icon={"\u260E"}
          value={values.telefon} onChange={set("telefon")}
          placeholder="Enter your phone number" autoComplete="tel" error={errors.telefon} />
        <TextField id="adresa" label="Address (optional)" icon={"\u2302"}
          value={values.adresa} onChange={set("adresa")}
          placeholder="Enter your address" autoComplete="street-address" error={errors.adresa} />
        <PasswordField id="password" label="Password"
          value={values.password} onChange={set("password")}
          placeholder="Create a password" autoComplete="new-password" error={errors.password} />
        <PasswordField id="confirmPassword" label="Confirm password"
          value={values.confirmPassword} onChange={set("confirmPassword")}
          placeholder="Repeat your password" autoComplete="new-password" error={errors.confirmPassword} />

        <button className="register-button" type="submit" disabled={submitting}>
          {submitting ? "Se creeaza contul..." : "Register"}
        </button>

        {formError && <p className="form-error">{formError}</p>}
      </form>
    </SplitLayout>
  );
}
