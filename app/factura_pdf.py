#Turns the invoice dict from rezervari.get_invoice() into a PDF.

import io
from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import Flowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

COMPANY_NAME = "Pet Hotel"
COMPANY_DETAILS = "Str. Exemplu 10, Bucuresti · contact@pet-hotel.ro · +40 700 000 000"
CURRENCY = "RON"

GREEN = colors.HexColor("#0b4008")
MUTED = colors.HexColor("#8a8d99")
LINE = colors.HexColor("#e6e8ef")
HAIRLINE = colors.HexColor("#f0f1f5")
TEXT = colors.HexColor("#111111")

MARGIN = 1.8 * cm
CONTENT_WIDTH = A4[0] - 2 * MARGIN

STATUS_LABELS = {"issued": "Payment due", "paid": "Paid", "cancelled": "Cancelled"}
STATUS_COLORS = {
    "issued": ("#fff4e0", "#a15c00"),
    "paid": ("#e3f7e8", "#1f7a3d"),
    "cancelled": ("#ffe3e3", "#a12626"),
}
METHOD_LABELS = {"card": "Card", "numerar": "Cash", "transfer": "Bank transfer"}

WORD_FONT = "Helvetica-Bold"


class LogoMark(Flowable):

    def __init__(self, height=0.9 * cm, color=colors.HexColor("#111111"),
                 text=COMPANY_NAME):
        super().__init__()
        self.height = height
        self.color = color
        self.text = text
        self.font_size = height * 0.68
        self.paws_width = height
        self.gap = height * 0.30
        self.text_width = pdfmetrics.stringWidth(text, WORD_FONT, self.font_size)
        self.width = self.paws_width + self.gap + self.text_width

    def wrap(self, *args):
        # Platypus asks how much room the flowable needs before drawing it.
        return self.width, self.height

    def paw(self, cx, cy, size, tilt):
        c = self.canv
        c.saveState()
        c.translate(cx, cy)
        c.rotate(tilt)

        pad_w, pad_h = size * 0.52, size * 0.40
        c.ellipse(-pad_w / 2, -size * 0.34, pad_w / 2, -size * 0.34 + pad_h,
                  fill=1, stroke=0)

        for dx, dy, angle in ((-0.30, 0.10, 22), (-0.11, 0.26, 8),
                              (0.11, 0.26, -8), (0.30, 0.10, -22)):
            c.saveState()
            c.translate(dx * size, dy * size)
            c.rotate(angle)
            toe_w, toe_h = size * 0.19, size * 0.25
            c.ellipse(-toe_w / 2, -toe_h / 2, toe_w / 2, toe_h / 2, fill=1, stroke=0)
            c.restoreState()

        c.restoreState()

    def draw(self):
        c = self.canv
        c.setFillColor(self.color)
        h = self.height
        self.paw(h * 0.34, h * 0.66, h * 0.62, 14)
        self.paw(h * 0.74, h * 0.28, h * 0.44, -6)
        c.setFont(WORD_FONT, self.font_size)
        c.drawString(self.paws_width + self.gap, h * 0.22, self.text)


def styles():
    base = getSampleStyleSheet()
    return {
        "body": ParagraphStyle("Body", parent=base["Normal"], fontSize=9.5,
                               leading=13, textColor=TEXT),
        "small": ParagraphStyle("Small", parent=base["Normal"], fontSize=8,
                                leading=11, textColor=MUTED),
        # charSpace is what gives the uppercase labels their tracking; without
        # it they read as shouting rather than as labels.
        "label": ParagraphStyle("Label", parent=base["Normal"], fontSize=7,
                                leading=10, textColor=MUTED,
                                fontName="Helvetica-Bold", charSpace=1.1),
        "labelLight": ParagraphStyle("LabelLight", parent=base["Normal"], fontSize=7,
                                     leading=10, textColor=colors.HexColor("#98a2c4"),
                                     fontName="Helvetica-Bold", charSpace=1.1,
                                     alignment=TA_RIGHT),
        "number": ParagraphStyle("Number", parent=base["Normal"], fontSize=16,
                                 leading=20, textColor=colors.white,
                                 fontName="Helvetica-Bold", alignment=TA_RIGHT),
        "cell": ParagraphStyle("Cell", parent=base["Normal"], fontSize=9.5,
                               leading=12, textColor=TEXT),
        "cellMuted": ParagraphStyle("CellMuted", parent=base["Normal"], fontSize=9.5,
                                    leading=12, textColor=MUTED),
        "totalLabel": ParagraphStyle("TotalLabel", parent=base["Normal"], fontSize=7.5,
                                     textColor=MUTED, fontName="Helvetica-Bold",
                                     charSpace=1.1, alignment=TA_RIGHT),
        "totalValue": ParagraphStyle("TotalValue", parent=base["Normal"], fontSize=17,
                                     leading=20, textColor=GREEN,
                                     fontName="Helvetica-Bold", alignment=TA_RIGHT),
    }


def money(value):
    return f"{value:.2f} {CURRENCY}"


def nights_label(nights):
    return f"{nights} night" if nights == 1 else f"{nights} nights"


def band(invoice, st):
    left = LogoMark(height=0.85 * cm, color=colors.white)

    right = [
        Paragraph("INVOICE", st["labelLight"]),
        Paragraph(invoice["number"], st["number"]),
        Spacer(1, 6),
        status_chip(invoice["status"], st),
    ]

    table = Table([[left, right]], colWidths=[CONTENT_WIDTH * 0.45, CONTENT_WIDTH * 0.55])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), GREEN),
                ("VALIGN", (0, 0), (0, 0), "MIDDLE"),
                ("VALIGN", (1, 0), (1, 0), "TOP"),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                ("LEFTPADDING", (0, 0), (-1, -1), 18),
                ("RIGHTPADDING", (0, 0), (-1, -1), 18),
                ("TOPPADDING", (0, 0), (-1, -1), 18),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 18),
            ]
        )
    )
    return table


def status_chip(status, st):
    background, text_color = STATUS_COLORS.get(status, ("#eef0f5", "#5f5f5f"))
    label = STATUS_LABELS.get(status, status)
    chip_style = ParagraphStyle(
        "Chip", parent=st["body"], fontSize=8, leading=10,
        textColor=colors.HexColor(text_color), fontName="Helvetica-Bold",
        alignment=TA_RIGHT,
    )

    chip = Table([[Paragraph(label, chip_style)]], colWidths=[len(label) * 4.9 + 18])
    chip.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(background)),
                ("ROUNDEDCORNERS", [7, 7, 7, 7]),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
            ]
        )
    )
    chip.hAlign = "RIGHT"
    return chip


def meta(invoice, st):
    issued = invoice["issued_at"]
    issued_text = issued.strftime("%d.%m.%Y") if hasattr(issued, "strftime") else str(issued)

    def column(label, *lines, style="body"):
        block = [Paragraph(label, st["label"]), Spacer(1, 3)]
        block += [Paragraph(line, st[style]) for line in lines if line]
        return block

    table = Table(
        [[
            column("BILLED TO", invoice["client"]),
            column("STAY",
                   f"{invoice['start_date']} &rarr; {invoice['end_date']}",
                   f"{nights_label(invoice['nights'])} · issued {issued_text}"),
            # The full code, not a prefix: this is the reference the client
            # quotes back when something is wrong with the booking.
            column("RESERVATION", invoice["reservation_code"], style="small"),
        ]],
        colWidths=[CONTENT_WIDTH / 3] * 3,
    )
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (0, 0), 0),
                ("RIGHTPADDING", (-1, 0), (-1, 0), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 16),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
                ("LINEBELOW", (0, 0), (-1, -1), 0.75, LINE),
            ]
        )
    )
    return table


def lines_table(invoice, st):
    data = [[
        Paragraph("DESCRIPTION", st["label"]),
        Paragraph("QTY", st["label"]),
        Paragraph("UNIT PRICE", st["label"]),
        Paragraph("AMOUNT", st["label"]),
    ]]

    for line in invoice["lines"]:
        included = line["included_in_package"]
        cell = st["cellMuted"] if included else st["cell"]
        description = line["description"]
        if included:
            description += "  (included)"
        data.append([
            Paragraph(description, cell),
            Paragraph(str(line["quantity"]), cell),
            Paragraph(money(line["unit_price"]), cell),
            Paragraph(money(line["amount"]), cell),
        ])

    table = Table(
        data,
        colWidths=[CONTENT_WIDTH - 190, 45, 72, 73],
        repeatRows=1,
    )
    table.setStyle(
        TableStyle(
            [
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (0, -1), 0),
                ("RIGHTPADDING", (-1, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
                ("LINEBELOW", (0, 0), (-1, 0), 0.75, LINE),
                ("LINEBELOW", (0, 1), (-1, -2), 0.5, HAIRLINE),
            ]
        )
    )
    return table


def total(invoice, st):
    label = "TOTAL PAID" if invoice["status"] == "paid" else "TOTAL DUE"
    table = Table(
        [[Paragraph(label, st["totalLabel"]), Paragraph(money(invoice["total"]), st["totalValue"])]],
        colWidths=[CONTENT_WIDTH - 160, 160],
    )
    table.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
                ("RIGHTPADDING", (-1, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("LINEABOVE", (0, 0), (-1, 0), 1.4, GREEN),
            ]
        )
    )
    return table


def payment_note(invoice):
    if invoice["status"] == "paid":
        method = METHOD_LABELS.get(invoice["payment_method"], invoice["payment_method"] or "-")
        paid_at = invoice.get("paid_at")
        when = paid_at.strftime("%d.%m.%Y") if hasattr(paid_at, "strftime") else ""
        return f"Paid by {method}{f' on {when}' if when else ''}. Nothing is due."
    if invoice["status"] == "cancelled":
        return "This reservation was cancelled. The invoice is kept for the record only."
    return "Payable at check-in or online in the app."


def generate_pdf(invoice):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=1.6 * cm,
        bottomMargin=1.6 * cm,
        title=f"Invoice {invoice['number']}",
        author=COMPANY_NAME,
    )
    st = styles()

    elements = [
        band(invoice, st),
        meta(invoice, st),
        Spacer(1, 6),
        lines_table(invoice, st),
        total(invoice, st),
        Spacer(1, 22),
        Paragraph(payment_note(invoice), st["body"]),
        Spacer(1, 6),
        Paragraph(COMPANY_DETAILS, st["small"]),
        Spacer(1, 4),
        Paragraph(
            "Generated automatically by the Pet Hotel application. Payments recorded "
            "here are simulated: no card details are requested or stored.",
            st["small"],
        ),
    ]

    doc.build(elements)
    return buffer.getvalue()