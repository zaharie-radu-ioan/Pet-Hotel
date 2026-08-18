import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { getInvoice, payReservation } from "../api/rezervari";
import AppHeader from "../components/AppHeader";

const STATUS_LABELS = {
  issued: "Issued",
  paid: "Paid",
  cancelled: "Cancelled",
};

// The database keeps its payment methods in Romanian; only the labels change.
const METHOD_LABELS = {
  card: "Card",
  numerar: "Cash",
  transfer: "Bank transfer",
};

function money(value) {
  return `${Number(value).toFixed(2)} RON`;
}

export default function FacturaPage() {
  const { code } = useParams();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [method, setMethod] = useState("card");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  useEffect(() => {
    async function loadInvoice() {
      try {
        setInvoice(await getInvoice(code));
        setError("");
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "We could not load the invoice."
        );
      } finally {
        setLoading(false);
      }
    }

    loadInvoice();
  }, [code]);

  async function handlePay() {
    setPayError("");
    setPaying(true);
    try {
      // The endpoint returns the refreshed invoice, so no second request.
      setInvoice(await payReservation(code, method));
    } catch (err) {
      setPayError(
        err instanceof ApiError ? err.message : "The payment could not be recorded."
      );
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="dashboard">
      <AppHeader />
      <main className="dashboard-body">
        <Link className="link-button" to="/rezervari">
          &larr; Back to bookings
        </Link>

        {loading ? (
          <p className="muted-text">Loading...</p>
        ) : error ? (
          <p className="form-error">{error}</p>
        ) : (
          <section className="card invoice-card">
            <div className="invoice-head">
              <div>
                <h2>Invoice {invoice.number}</h2>
                <p className="muted-text">
                  Issued on {new Date(invoice.issued_at).toLocaleDateString("en-GB")}
                  {" · "}
                  {invoice.client}
                </p>
                <p className="muted-text">
                  {invoice.start_date} &rarr; {invoice.end_date} ({invoice.nights}{" "}
                  {invoice.nights === 1 ? "night" : "nights"})
                </p>
              </div>
              <span className={`status-badge invoice-${invoice.status}`}>
                {STATUS_LABELS[invoice.status] ?? invoice.status}
              </span>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line, index) => (
                  <tr
                    key={index}
                    className={line.included_in_package ? "line-included" : ""}
                  >
                    <td>
                      {line.description}
                      {line.included_in_package && (
                        <span className="included-tag">included in package</span>
                      )}
                    </td>
                    <td>{line.quantity}</td>
                    <td>{money(line.unit_price)}</td>
                    <td>{money(line.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}>Total</td>
                  <td>{money(invoice.total)}</td>
                </tr>
              </tfoot>
            </table>

            {invoice.status === "paid" ? (
              <p className="success-message">
                Paid by {METHOD_LABELS[invoice.payment_method] ?? invoice.payment_method}
                {invoice.paid_at &&
                  ` on ${new Date(invoice.paid_at).toLocaleDateString("en-GB")}`}
                .
              </p>
            ) : invoice.status === "issued" ? (
              <div className="invoice-pay">
                <label className="field-label">
                  Payment method
                  <select value={method} onChange={(e) => setMethod(e.target.value)}>
                    <option value="card">Card</option>
                    <option value="numerar">Cash</option>
                    <option value="transfer">Bank transfer</option>
                  </select>
                </label>
                <button
                  className="register-button"
                  type="button"
                  onClick={handlePay}
                  disabled={paying}
                >
                  {paying ? "Processing..." : `Pay ${money(invoice.total)}`}
                </button>
                <p className="muted-text">
                  This payment is simulated: no card details are asked for or stored.
                </p>
                {payError && <p className="form-error">{payError}</p>}
              </div>
            ) : null}
          </section>
        )}
      </main>
    </div>
  );
}