import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, saveBlob } from "../api/client";
import { downloadInvoicePdf, getInvoice, payReservation } from "../api/rezervari";
import AppHeader from "../components/AppHeader";

const STATUS_LABELS = {
  issued: "Payment due",
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

// The API sends plain dates ("2026-08-20"). Parsing that string alone gives
// midnight UTC, which can land on the previous day once it is shown in a local
// timezone, so the time is pinned to local midnight first.
function day(value) {
  if (!value) return "";
  const date = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function FacturaPage() {
  const { code } = useParams();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [method, setMethod] = useState("card");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

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

  async function handleDownload() {
    setDownloadError("");
    setDownloading(true);
    try {
      // The backend builds the PDF and names the file; the fallback only
      // matters if that header does not reach us.
      const { blob, filename } = await downloadInvoicePdf(code);
      saveBlob(blob, filename ?? `Invoice_${invoice.number}.pdf`);
    } catch (err) {
      setDownloadError(
        err instanceof ApiError ? err.message : "The PDF could not be generated."
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="dashboard">
      <AppHeader />
      <main className="dashboard-body invoice-body">
        <Link className="link-button inv-back" to="/rezervari">
          &larr; Back to bookings
        </Link>

        {loading ? (
          <p className="muted-text">Loading...</p>
        ) : error ? (
          <p className="form-error">{error}</p>
        ) : (
          <article className="inv-doc">
            <header className="inv-band">
              <div>
                <p className="inv-eyebrow">Invoice</p>
                <h2 className="inv-number">{invoice.number}</h2>
              </div>
              <div className="inv-band-actions">
                <span className={`inv-chip inv-chip-${invoice.status}`}>
                  {STATUS_LABELS[invoice.status] ?? invoice.status}
                </span>
                <button
                  className="inv-pdf-button"
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? "Preparing..." : "Download PDF"}
                </button>
              </div>
            </header>

            <section className="inv-meta">
              <div>
                <p className="inv-meta-label">Billed to</p>
                <p className="inv-meta-value">{invoice.client}</p>
              </div>
              <div>
                <p className="inv-meta-label">Stay</p>
                <p className="inv-meta-value">
                  {day(invoice.start_date)} &rarr; {day(invoice.end_date)}
                  {" · "}
                  {invoice.nights} {invoice.nights === 1 ? "night" : "nights"}
                </p>
              </div>
              <div>
                <p className="inv-meta-label">Issued</p>
                <p className="inv-meta-value">{day(invoice.issued_at)}</p>
              </div>
            </section>

            <div className="inv-lines">
              <table className="inv-table">
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
                      className={line.included_in_package ? "inv-row-included" : ""}
                    >
                      <td>
                        {line.description}
                        {line.included_in_package && (
                          <span className="inv-tag">included</span>
                        )}
                      </td>
                      <td>{line.quantity}</td>
                      <td>{money(line.unit_price)}</td>
                      <td>{money(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="inv-total">
              <span className="inv-total-label">
                {invoice.status === "paid" ? "Total paid" : "Total due"}
              </span>
              <span className="inv-total-value">{money(invoice.total)}</span>
            </div>

            {invoice.status === "paid" ? (
              <p className="inv-paid">
                Paid by {METHOD_LABELS[invoice.payment_method] ?? invoice.payment_method}
                {invoice.paid_at && ` on ${day(invoice.paid_at)}`}.
              </p>
            ) : invoice.status === "issued" ? (
              <section className="inv-pay">
                <div className="inv-pay-row">
                  <label className="inv-field">
                    Payment method
                    <select
                      className="inv-select"
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                    >
                      <option value="card">Card</option>
                      <option value="numerar">Cash</option>
                      <option value="transfer">Bank transfer</option>
                    </select>
                  </label>
                  <button
                    className="inv-pay-button"
                    type="button"
                    onClick={handlePay}
                    disabled={paying}
                  >
                    {paying ? "Processing..." : `Pay ${money(invoice.total)}`}
                  </button>
                </div>
                <p className="inv-note">
                  Simulated payment: no card details are requested or stored.
                </p>
                {payError && <p className="inv-error">{payError}</p>}
              </section>
            ) : null}

            {downloadError && (
              <p className="inv-error" style={{ padding: "0 26px 20px" }}>
                {downloadError}
              </p>
            )}
          </article>
        )}
      </main>
    </div>
  );
}