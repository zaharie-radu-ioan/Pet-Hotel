
import sys
from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.db import run_select, run_select_one
from app.factura_pdf import LogoMark

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "outputs"
PDF_PATH = OUTPUT_DIR / "Factura.pdf"
LOGO_HEIGHT = 0.95 * cm


def fetch_data(code):

    sql = """
        SELECT z.nume_animal AS animal,
               z.pret_camera_noapte * DATEDIFF(r.data_final, r.data_inceput) AS cazare,
               COALESCE(SUM(cs.cantitate * cs.pret_aplicat), 0) AS servicii,
               z.pret_camera_noapte * DATEDIFF(r.data_final, r.data_inceput)
                 + COALESCE(SUM(cs.cantitate * cs.pret_aplicat), 0) AS total
        FROM cazare z
        JOIN rezervare r ON r.id_rezervare = z.id_rezervare
        LEFT JOIN cazare_serviciu cs
               ON cs.id_cazare = z.id_cazare AND cs.status <> 'anulat'
        WHERE r.cod = ?
        GROUP BY z.id_cazare, z.nume_animal, z.pret_camera_noapte,
                 r.data_inceput, r.data_final
        ORDER BY total DESC
    """
    rows = run_select(sql, (code,))
    return [
        {"animal": r[0], "cazare": r[1], "servicii": r[2], "total": r[3]}
        for r in rows
    ]


def fetch_header(code):
    return run_select_one(
        "SELECT r.cod, r.data_inceput, r.data_final, r.total, r.status, "
        "       DATEDIFF(r.data_final, r.data_inceput) AS nopti, "
        "       CONCAT(cl.prenume, ' ', cl.nume) AS client "
        "FROM rezervare r "
        "JOIN client cl ON cl.id_client = r.id_client "
        "WHERE r.cod = ?",
        (code,),
        dictionary=True,
    )


def generate_pdf(data, header):
    doc = SimpleDocTemplate(str(PDF_PATH), pagesize=A4)
    elements = []

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        name="TitleStyle",
        parent=styles["Heading1"],
        fontSize=18,
        spaceAfter=20,
    )
    normal_style = styles["Normal"]

    # The logo is drawn, not loaded: no image file has to exist for this to run.
    logo = LogoMark(height=LOGO_HEIGHT)
    logo.hAlign = "LEFT"
    elements.append(logo)
    elements.append(Spacer(1, 18))

    elements.append(Paragraph("Pet Hotel - Invoice", title_style))
    elements.append(Paragraph(f"Reservation {header['cod']}", styles["Heading2"]))
    elements.append(Spacer(1, 15))

    intro_text = (
        f"Invoice for {header['client']}. "
        f"Stay: {header['data_inceput']} - {header['data_final']} "
        f"({header['nopti']} nights). "
        f"Amounts are grouped per animal: room price times the number of nights, "
        f"plus every service booked for that animal. "
        f"Generated on {datetime.now().strftime('%d.%m.%Y %H:%M')}."
    )
    elements.append(Paragraph(intro_text, normal_style))
    elements.append(Spacer(1, 20))

    table_data = [["Animal", "Room", "Services", "Total"]]
    for d in data:
        table_data.append(
            [d["animal"], f"{d['cazare']:.2f}", f"{d['servicii']:.2f}", f"{d['total']:.2f}"]
        )
    table_data.append(["TOTAL", "", "", f"{header['total']:.2f}"])

    table = Table(table_data, colWidths=[180, 100, 100, 100])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2737a1")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#ecf0f1")),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ]
        )
    )
    elements.append(table)

    doc.build(elements)


def main():
    code = sys.argv[1] if len(sys.argv) > 1 else None
    if not code:
        row = run_select_one(
            "SELECT cod FROM rezervare ORDER BY created_at DESC LIMIT 1",
            (),
            dictionary=True,
        )
        code = row["cod"] if row else None
    if not code:
        print("There is no reservation in the database.")
        return

    header = fetch_header(code)
    if not header:
        print(f"No reservation found for code: {code}")
        return

    OUTPUT_DIR.mkdir(exist_ok=True)
    generate_pdf(fetch_data(code), header)

    print(f"Invoice for {header['client']} - {header['total']} RON")
    print(f"PDF written to {PDF_PATH}")


if __name__ == "__main__":
    main()