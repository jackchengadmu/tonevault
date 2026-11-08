from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "ToneVault-GC2-Business-Summary.pdf"

NAVY = colors.HexColor("#111827")
SLATE = colors.HexColor("#334155")
GOLD = colors.HexColor("#B68A35")
CREAM = colors.HexColor("#F7F2E8")
PALE_GOLD = colors.HexColor("#F4E9CE")
PALE_BLUE = colors.HexColor("#EAF0F6")
WHITE = colors.white
LINE = colors.HexColor("#D8DEE8")

pdfmetrics.registerFont(
    TTFont("ToneVault", "/System/Library/Fonts/Supplemental/Arial.ttf")
)
pdfmetrics.registerFont(
    TTFont("ToneVault-Bold", "/System/Library/Fonts/Supplemental/Arial Bold.ttf")
)


def page_frame(canvas, document):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, height - 0.24 * inch, width, 0.24 * inch, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.rect(0, height - 0.29 * inch, width, 0.05 * inch, fill=1, stroke=0)
    canvas.setStrokeColor(LINE)
    canvas.line(0.58 * inch, 0.48 * inch, width - 0.58 * inch, 0.48 * inch)
    canvas.setFont("ToneVault", 7.5)
    canvas.setFillColor(SLATE)
    canvas.drawString(0.58 * inch, 0.27 * inch, "ToneVault GC2 | Group 2 | Member 4 revenue features")
    canvas.drawRightString(width - 0.58 * inch, 0.27 * inch, f"Page {document.page}")
    canvas.restoreState()


styles = getSampleStyleSheet()
title = ParagraphStyle(
    "Title",
    parent=styles["Title"],
    fontName="ToneVault-Bold",
    fontSize=23,
    leading=27,
    textColor=NAVY,
    alignment=TA_LEFT,
    spaceAfter=6,
)
kicker = ParagraphStyle(
    "Kicker",
    fontName="ToneVault-Bold",
    fontSize=8,
    leading=10,
    textColor=GOLD,
    spaceAfter=5,
)
deck = ParagraphStyle(
    "Deck",
    fontName="ToneVault",
    fontSize=10.5,
    leading=14.5,
    textColor=SLATE,
    spaceAfter=14,
)
heading = ParagraphStyle(
    "Heading",
    fontName="ToneVault-Bold",
    fontSize=13.5,
    leading=16,
    textColor=NAVY,
    spaceBefore=4,
    spaceAfter=6,
)
subheading = ParagraphStyle(
    "Subheading",
    fontName="ToneVault-Bold",
    fontSize=10,
    leading=12,
    textColor=NAVY,
    spaceAfter=4,
)
body = ParagraphStyle(
    "Body",
    fontName="ToneVault",
    fontSize=9.2,
    leading=13,
    textColor=SLATE,
    spaceAfter=7,
)
small = ParagraphStyle(
    "Small",
    fontName="ToneVault",
    fontSize=8.1,
    leading=11,
    textColor=SLATE,
)
small_bold = ParagraphStyle(
    "SmallBold",
    parent=small,
    fontName="ToneVault-Bold",
    textColor=NAVY,
)
card_title = ParagraphStyle(
    "CardTitle",
    fontName="ToneVault-Bold",
    fontSize=11.5,
    leading=14,
    textColor=NAVY,
    spaceAfter=4,
)
card_title_white = ParagraphStyle(
    "CardTitleWhite",
    parent=card_title,
    textColor=WHITE,
)
small_bold_white = ParagraphStyle(
    "SmallBoldWhite",
    parent=small_bold,
    textColor=WHITE,
)
subheading_white = ParagraphStyle(
    "SubheadingWhite",
    parent=subheading,
    textColor=WHITE,
)
number = ParagraphStyle(
    "Number",
    fontName="ToneVault-Bold",
    fontSize=19,
    leading=22,
    textColor=GOLD,
    alignment=TA_CENTER,
)
center_small = ParagraphStyle(
    "CenterSmall",
    parent=small,
    alignment=TA_CENTER,
)


def p(text, style=body):
    return Paragraph(text, style)


def bullet(text):
    return Paragraph(f"<font color='#B68A35'>●</font>&nbsp;&nbsp;{text}", body)


def feature_card(label, title_text, rule, value, limitation):
    content = [
        p(label.upper(), kicker),
        p(title_text, card_title),
        p(f"<b>Rule:</b> {rule}", small),
        p(f"<b>Business value:</b> {value}", small),
        p(f"<b>Limit:</b> {limitation}", small),
    ]
    table = Table([[content]], colWidths=[3.29 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), CREAM),
                ("BOX", (0, 0), (-1, -1), 0.8, GOLD),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return table


def calculation_card(title_text, instrument, lines, conclusion):
    rows = [
        [p(title_text, card_title_white)],
        [p(instrument, small_bold_white)],
    ]
    for left, right in lines:
        rows.append([Table([[p(left, small), p(right, small_bold)]], colWidths=[1.72 * inch, 1.13 * inch])])
    rows.append([p(conclusion, small)])
    table = Table(rows, colWidths=[3.12 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 1), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 1), WHITE),
                ("BACKGROUND", (0, 2), (-1, -2), colors.white),
                ("BACKGROUND", (0, -1), (-1, -1), PALE_GOLD),
                ("BOX", (0, 0), (-1, -1), 0.8, LINE),
                ("INNERGRID", (0, 2), (-1, -2), 0.35, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 11),
                ("RIGHTPADDING", (0, 0), (-1, -1), 11),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return table


story = []

story.extend(
    [
        p("GROUP 2 / GC2 BUSINESS SUMMARY", kicker),
        p("Revenue that supports trust", title),
        p(
            "ToneVault is a marketplace prototype for premium pre-owned and vintage guitars. "
            "Member 4 added two GC1 revenue features that are simple to explain, calculated by "
            "the server, and saved with each order.",
            deck,
        ),
        p("What we built", heading),
        p(
            "The server reads the current catalog price, ignores any total typed by the browser, "
            "and calculates with integer centavos. The database checks the price and stock again, "
            "then saves the order and reduces stock in one transaction. Each saved order keeps its "
            "own price, rate, fee, payout, platform revenue, and total.",
            body,
        ),
        Spacer(1, 3),
    ]
)

feature_table = Table(
    [
        [
            feature_card(
                "Revenue feature 1",
                "8% marketplace commission",
                "ToneVault keeps 8% of the guitar subtotal from the seller.",
                "Revenue grows when ToneVault helps complete more and higher-value sales.",
                "The buyer still pays the listed guitar price when no add-on is chosen.",
            ),
            feature_card(
                "Revenue feature 2",
                "Optional verification add-on",
                "None: ₱0 / Remote: ₱2,800 / Physical: ₱8,500, added once per order.",
                "Monetizes ToneVault's trust service while directly supporting the value proposition.",
                "Optional by design; not every buyer needs another inspection.",
            ),
        ]
    ],
    colWidths=[3.38 * inch, 3.38 * inch],
    hAlign="LEFT",
)
feature_table.setStyle(
    TableStyle(
        [
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]
    )
)
story.extend([feature_table, Spacer(1, 13), p("How pricing travels", heading)])

flow = Table(
    [
        [
            p("1", number),
            p("2", number),
            p("3", number),
            p("4", number),
        ],
        [
            p("Browser sends product, quantity, option", center_small),
            p("Server reads catalog price", center_small),
            p("Shared rules calculate the breakdown", center_small),
            p("Database validates, saves, updates stock", center_small),
        ],
    ],
    colWidths=[1.68 * inch] * 4,
)
flow.setStyle(
    TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), PALE_BLUE),
            ("BOX", (0, 0), (-1, -1), 0.6, LINE),
            ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
            ("TOPPADDING", (0, 0), (-1, 0), 5),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 2),
            ("TOPPADDING", (0, 1), (-1, 1), 5),
            ("BOTTOMPADDING", (0, 1), (-1, 1), 8),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]
    )
)
story.extend(
    [
        flow,
        Spacer(1, 13),
        p("Why this supports GC1", heading),
        bullet("Commission aligns ToneVault's income with successful marketplace activity."),
        bullet("Verification earns revenue from the trust service that differentiates ToneVault."),
        bullet("Server-owned pricing prevents a browser from lowering the saved total."),
        Spacer(1, 3),
        Table(
            [[p("GC2 scope: simulated payment only. The values are pricing snapshots, not proof that cash was received.", small_bold)]],
            colWidths=[6.75 * inch],
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), PALE_GOLD),
                    ("BOX", (0, 0), (-1, -1), 0.7, GOLD),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 7),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ]
            ),
        ),
        PageBreak(),
    ]
)

story.extend(
    [
        p("WORKED NUMBERS AND EVIDENCE", kicker),
        p("What the rules produce", title),
        p(
            "These examples separate what the buyer pays, what the seller receives, and what "
            "ToneVault records. The automated results matched every expected value.",
            deck,
        ),
    ]
)

calculations = Table(
    [
        [
            calculation_card(
                "Commission example",
                "PRS Custom 24 / ₱168,000 / no add-on",
                [
                    ("Buyer total", "₱168,000"),
                    ("Commission: 8%", "₱13,440"),
                    ("Seller payout", "₱154,560"),
                    ("ToneVault revenue", "₱13,440"),
                ],
                "Conclusion: revenue is tied to a recorded marketplace sale.",
            ),
            calculation_card(
                "Verification example",
                "Gibson ES-335 / ₱195,000 / physical",
                [
                    ("Buyer total", "₱203,500"),
                    ("Commission: 8%", "₱15,600"),
                    ("Seller payout", "₱179,400"),
                    ("ToneVault revenue", "₱24,100"),
                ],
                "Conclusion: physical verification adds ₱8,500 while supporting buyer trust.",
            ),
        ]
    ],
    colWidths=[3.37 * inch, 3.37 * inch],
)
calculations.setStyle(
    TableStyle(
        [
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]
    )
)
story.extend([calculations, Spacer(1, 14), p("Implementation evidence", heading)])

evidence_rows = [
    ("Single source", "One active rules file owns 8%, ₱2,800, and ₱8,500."),
    ("Server quote", "Returns unit price, subtotal, fee, commission, payout, platform revenue, and total."),
    ("Saved snapshot", "The migration records the breakdown and keeps historical orders unchanged."),
    ("Verification", "17 tests passed; typecheck, changed-file lint, and production build passed."),
    ("Live read-only check", "A supplied total of 1 was ignored; the catalog price produced the result."),
]
evidence = Table(
    [[p(left, small_bold), p(right, small)] for left, right in evidence_rows],
    colWidths=[1.3 * inch, 5.42 * inch],
)
evidence.setStyle(
    TableStyle(
        [
            ("BACKGROUND", (0, 0), (0, -1), PALE_BLUE),
            ("BOX", (0, 0), (-1, -1), 0.6, LINE),
            ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]
    )
)
story.extend([evidence, Spacer(1, 13), p("Limits and next integration decision", heading)])

limits = [
    bullet("Payment is simulated. Saved amounts are projected revenue, not cash received."),
    bullet("The migration is not applied to the shared database and the pricing PRs are unmerged."),
    bullet("Member 3 PR #37 duplicates pricing. Keep Member 4's rules as the one source and adapt Member 3's authentication/contact flow to the new order contract."),
    bullet("Deployed Postman evidence, human review, and Member 4's own Challenge 5 recording remain separate requirements."),
]
story.extend(
    [
        KeepTogether(limits),
        Spacer(1, 4),
        Table(
            [[p("Bottom line", subheading_white), p("Commission monetizes completed sales; optional verification monetizes trust. Both are transparent, server-calculated, and saved for later reporting.", body)]],
            colWidths=[1.2 * inch, 5.52 * inch],
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (0, 0), NAVY),
                    ("TEXTCOLOR", (0, 0), (0, 0), WHITE),
                    ("BACKGROUND", (1, 0), (1, 0), CREAM),
                    ("BOX", (0, 0), (-1, -1), 0.8, GOLD),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 9),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            ),
        ),
    ]
)

document = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    rightMargin=0.58 * inch,
    leftMargin=0.58 * inch,
    topMargin=0.48 * inch,
    bottomMargin=0.62 * inch,
    title="ToneVault GC2 Business Summary",
    author="Group 2 - Member 4",
    subject="GC2 business model and revenue strategy",
)
document.build(story, onFirstPage=page_frame, onLaterPages=page_frame)
print(OUTPUT)
