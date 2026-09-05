"""
NetGuard AI - Enterprise PDF Audit Report Generator (single-file, fixed).

Drop-in replacement for backend/app/reports/pdf_generator.py.
Public interface is unchanged:

    AuditReportGenerator.generate_pdf(assessment_data, devices, findings, category_scores) -> bytes

Nothing else in your app (assessment.py, report.py endpoints, etc.) needs to
change - same class name, same classmethod name, same argument order,
same return type (bytes).

WHAT WAS FIXED VS. YOUR ORIGINAL FILE
--------------------------------------------------------------------------
1. Blank/orphan page after the Device Inventory table.
   Root cause: the "Device Inventory" heading + table were two separate
   flowables placed right after a fairly full page. When the category
   table used up most of the space, the device table (heading + a couple
   of rows) had nowhere left to go and started a page of its own -
   almost empty. Then the old code did an unconditional
   `story.append(PageBreak())` right before the findings section, which
   forced yet another new page immediately after that near-empty one.
   That's the "blank page" you saw.
   Fix: each heading+table pair is now wrapped in KeepTogether(...) so a
   table can never be orphaned alone on a page, and the unconditional
   PageBreak() before the findings section was replaced with
   CondPageBreak(FINDINGS_SECTION_MIN_SPACE), which only starts a new
   page when there genuinely isn't room left. This generalizes to any
   number of devices/categories/findings, not just one sample case.

2. The grey "Vendor CLI Remediation Command" code box was visually
   overlapping and clipping the last line of the paragraph above it.
   This is a known ReportLab quirk: a Paragraph with backColor= and
   borderPadding= does not reliably reserve its own layout height.
   Fix: the code block is now rendered as a single-cell Table instead of
   a Paragraph with border padding - Table cell padding is accounted for
   correctly, so the box no longer collides with the text above it.

3. Professional/industry-recognized presentation:
   - A real cover page (classification banner, report title, audit
     metadata table) instead of a banner glued to the top of the content.
   - A running footer on every page with product name, confidentiality
     classification, and an accurate "Page X of Y" (via a buffered
     NumberedCanvas - the standard ReportLab two-pass technique, since
     the total page count isn't known until the whole story is laid out).
   - A slim repeating header band on continuation pages.
   - An explicit "N additional findings omitted" note if there are more
     than MAX_FINDINGS_RENDERED findings, instead of a silent truncation.
--------------------------------------------------------------------------
"""
import io
from datetime import datetime
from typing import List, Dict, Any

from app.core.config import settings  # noqa: F401  (kept for parity with original module)


# ============================================================================
# Configuration - brand colors, layout metrics, report copy.
# Change the accent color, margins, or disclaimer text in exactly one place.
# ============================================================================

class Palette:
    from reportlab.lib import colors

    PRIMARY = colors.HexColor("#0F172A")     # Slate 900 - headings, table headers
    SECONDARY = colors.HexColor("#1E293B")   # Slate 800 - body text
    MUTED = colors.HexColor("#64748B")       # Slate 500 - captions, footers
    ACCENT_BLUE = colors.HexColor("#2563EB") # Blue 600 - brand accent / rules
    LIGHT_BG = colors.HexColor("#F8FAFC")    # Slate 50  - zebra striping / boxes
    BORDER = colors.HexColor("#E2E8F0")      # Slate 200 - table/box borders
    WHITE = colors.white

    HEX = {
        "CRITICAL": "#DC2626",  # Red 600
        "HIGH": "#EA580C",      # Orange 600
        "MEDIUM": "#D97706",    # Amber 600
        "LOW": "#16A34A",       # Green 600
        "INFO": "#64748B",      # Slate 500
    }
    CRITICAL = colors.HexColor(HEX["CRITICAL"])
    HIGH = colors.HexColor(HEX["HIGH"])
    MEDIUM = colors.HexColor(HEX["MEDIUM"])
    LOW = colors.HexColor(HEX["LOW"])
    INFO = colors.HexColor(HEX["INFO"])

    SEVERITY_MAP = {"CRITICAL": CRITICAL, "HIGH": HIGH, "MEDIUM": MEDIUM, "LOW": LOW, "INFO": INFO}

    @classmethod
    def severity_color(cls, severity: str):
        """Color object, for use as a ParagraphStyle textColor=."""
        return cls.SEVERITY_MAP.get((severity or "").upper(), cls.INFO)

    @classmethod
    def severity_hex(cls, severity: str) -> str:
        """Hex string, for use inside inline <font color='...'> HTML."""
        return cls.HEX.get((severity or "").upper(), cls.HEX["INFO"])

    @classmethod
    def score_color_hex(cls, score: float) -> str:
        if score >= 85.0:
            return cls.HEX["LOW"]
        elif score >= 70.0:
            return cls.HEX["MEDIUM"]
        elif score >= 50.0:
            return cls.HEX["HIGH"]
        return cls.HEX["CRITICAL"]


class Layout:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch

    PAGE_SIZE = letter
    MARGIN_LEFT = 0.6 * inch
    MARGIN_RIGHT = 0.6 * inch
    MARGIN_TOP = 0.85 * inch      # extra room reserved for the running header band
    MARGIN_BOTTOM = 0.65 * inch   # extra room reserved for the footer bar
    CONTENT_WIDTH = PAGE_SIZE[0] - MARGIN_LEFT - MARGIN_RIGHT

    # Minimum vertical space (points) required before starting the
    # "Detailed Findings" section; otherwise a fresh page is started. This
    # (instead of an unconditional PageBreak) is what prevents the
    # near-blank orphan page - a section header never gets stranded alone
    # at the bottom of a page, and a table never opens a page by itself.
    FINDINGS_SECTION_MIN_SPACE = 220
    MAX_FINDINGS_RENDERED = 25


class ReportMeta:
    PRODUCT_NAME = "NetGuard AI"
    PRODUCT_TAGLINE = "Privacy-Preserving Multi-Vendor Network Security Auditor"
    LOCAL_AUDIT_BADGE = "LOCAL AUDIT"
    LOCAL_AUDIT_SUBTEXT = "Data Remained on Local Host"
    CLASSIFICATION = "CONFIDENTIAL \u2014 INTERNAL USE ONLY"
    SANITIZATION_NOTICE = (
        "All technical evidence in this report has been sanitized to guarantee "
        "that no credentials or secrets appear in the document."
    )
    FOOTER_DISCLAIMER = (
        "Generated by NetGuard AI. This report is intended solely for the "
        "authorized recipient organization and its designated security personnel."
    )


# ============================================================================
# Small helpers
# ============================================================================

def _short_id(value, length: int = 8) -> str:
    if not value:
        return "N/A"
    value = str(value)
    return value[:length] + ("..." if len(value) > length else "")


def _status_for_score(score: float) -> str:
    if score >= 85:
        return "COMPLIANT"
    if score >= 60:
        return "NEEDS REVIEW"
    return "NON-COMPLIANT"


def _as_html_lines(text: str) -> str:
    return (text or "").replace("\n", "<br/>")


def _build_styles():
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "ReportTitle", parent=base["Heading1"],
            fontName="Helvetica-Bold", fontSize=22, leading=26,
            textColor=Palette.PRIMARY, alignment=TA_LEFT,
        ),
        "cover_title": ParagraphStyle(
            "CoverTitle", parent=base["Heading1"],
            fontName="Helvetica-Bold", fontSize=28, leading=34,
            textColor=Palette.PRIMARY, alignment=TA_LEFT, spaceAfter=6,
        ),
        "cover_subtitle": ParagraphStyle(
            "CoverSubtitle", parent=base["Normal"],
            fontName="Helvetica", fontSize=13, leading=18,
            textColor=Palette.MUTED, alignment=TA_LEFT,
        ),
        "classification": ParagraphStyle(
            "Classification", parent=base["Normal"],
            fontName="Helvetica-Bold", fontSize=9.5, leading=12,
            textColor=Palette.CRITICAL, alignment=TA_LEFT,
        ),
        "subtitle": ParagraphStyle(
            "ReportSubtitle", parent=base["Normal"],
            fontName="Helvetica", fontSize=10.5, leading=14,
            textColor=Palette.MUTED, alignment=TA_LEFT,
        ),
        "subtitle_right": ParagraphStyle(
            "ReportSubtitleRight", parent=base["Normal"],
            fontName="Helvetica", fontSize=10.5, leading=14,
            textColor=Palette.MUTED, alignment=TA_RIGHT,
        ),
        "h2": ParagraphStyle(
            "SectionHeader", parent=base["Heading2"],
            fontName="Helvetica-Bold", fontSize=14, leading=18,
            textColor=Palette.PRIMARY, spaceBefore=10, spaceAfter=5,
        ),
        "body": ParagraphStyle(
            "BodyTextCustom", parent=base["Normal"],
            fontName="Helvetica", fontSize=9.5, leading=13.5,
            textColor=Palette.SECONDARY, alignment=TA_JUSTIFY,
        ),
        "score_value": ParagraphStyle(
            "ScoreValue", fontName="Helvetica-Bold", fontSize=13,
            alignment=TA_CENTER, leading=16,
        ),
        "code": ParagraphStyle(
            # No backColor/borderPadding here on purpose: this Paragraph is
            # always placed inside a Table cell (_build_code_box), which
            # handles the shaded box and padding itself. ReportLab's
            # Paragraph-level backColor/borderPadding does not reserve its
            # own layout height reliably and was clipping the text of the
            # flowable placed just above it - see fix note #2 up top.
            "CodeStyle", parent=base["Code"],
            fontName="Courier", fontSize=8, leading=11,
            textColor=Palette.PRIMARY,
        ),
    }


# ============================================================================
# Page decoration: running footer with page numbers + confidentiality strip,
# repeated on every page; slim header band on continuation pages.
# ============================================================================

def _make_numbered_canvas():
    from reportlab.pdfgen import canvas as _canvas_mod

    class NumberedCanvas(_canvas_mod.Canvas):
        def __init__(self, *args, **kwargs):
            _canvas_mod.Canvas.__init__(self, *args, **kwargs)
            self._saved_page_states = []

        def showPage(self):
            self._saved_page_states.append(dict(self.__dict__))
            self._startPage()

        def save(self):
            num_pages = len(self._saved_page_states)
            for state in self._saved_page_states:
                self.__dict__.update(state)
                self._draw_footer(num_pages)
                if self._pageNumber > 1:
                    self._draw_header_band()
                _canvas_mod.Canvas.showPage(self)
            _canvas_mod.Canvas.save(self)

        def _draw_footer(self, page_count):
            width, _ = Layout.PAGE_SIZE
            self.setStrokeColor(Palette.BORDER)
            self.setLineWidth(0.75)
            y_rule = Layout.MARGIN_BOTTOM - 10
            self.line(Layout.MARGIN_LEFT, y_rule, width - Layout.MARGIN_RIGHT, y_rule)

            self.setFont("Helvetica", 7.5)
            self.setFillColor(Palette.MUTED)
            self.drawString(
                Layout.MARGIN_LEFT, y_rule - 12,
                f"{ReportMeta.PRODUCT_NAME} \u2022 {ReportMeta.CLASSIFICATION}",
            )
            self.drawRightString(
                width - Layout.MARGIN_RIGHT, y_rule - 12,
                f"Page {self._pageNumber} of {page_count}",
            )

        def _draw_header_band(self):
            width, height = Layout.PAGE_SIZE
            self.setStrokeColor(Palette.ACCENT_BLUE)
            self.setLineWidth(1.2)
            y = height - (Layout.MARGIN_TOP - 22)
            self.line(Layout.MARGIN_LEFT, y, width - Layout.MARGIN_RIGHT, y)
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(Palette.MUTED)
            self.drawString(Layout.MARGIN_LEFT, y + 4, ReportMeta.PRODUCT_NAME.upper())
            self.drawRightString(width - Layout.MARGIN_RIGHT, y + 4, ReportMeta.CLASSIFICATION)

    return NumberedCanvas


# ============================================================================
# Section builders. Each returns a list of flowables.
# ============================================================================

def _build_cover_page(styles, assessment_data: Dict[str, Any], devices: List[Dict[str, Any]]) -> list:
    from reportlab.platypus import Paragraph, Spacer, Table, TableStyle, HRFlowable

    story = []
    header_data = [[
        Paragraph(
            f"<b>{ReportMeta.PRODUCT_NAME.upper()}</b><br/>"
            f"<font size=9 color='#2563EB'>{ReportMeta.PRODUCT_TAGLINE}</font>",
            styles["title"],
        ),
        Paragraph(
            f"<b>\U0001F512 {ReportMeta.LOCAL_AUDIT_BADGE}</b><br/>"
            f"<font size=8 color='#16A34A'>{ReportMeta.LOCAL_AUDIT_SUBTEXT}</font>",
            styles["subtitle_right"],
        ),
    ]]
    header_table = Table(header_data, colWidths=[Layout.CONTENT_WIDTH * 0.65, Layout.CONTENT_WIDTH * 0.35])
    header_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=2, color=Palette.ACCENT_BLUE, spaceBefore=4, spaceAfter=28))

    story.append(Spacer(1, 60))
    story.append(Paragraph(ReportMeta.CLASSIFICATION, styles["classification"]))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Network Security Compliance Audit Report", styles["cover_title"]))
    story.append(Paragraph(
        "Multi-vendor configuration hardening assessment against CIS / NIST baselines",
        styles["cover_subtitle"],
    ))
    story.append(Spacer(1, 40))

    created_at_str = str(assessment_data.get("created_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S")))[:19]
    vendor_list = sorted({d.get("vendor", "Unknown") for d in devices}) or ["N/A"]

    meta_rows = [
        ["Audit ID", _short_id(assessment_data.get("id"))],
        ["Report Date", created_at_str],
        ["Devices Analyzed", str(assessment_data.get("total_devices", len(devices)))],
        ["Vendors In Scope", ", ".join(vendor_list)],
        ["Prepared By", ReportMeta.PRODUCT_NAME],
    ]
    meta_table = Table(
        [[Paragraph(f"<b>{k}</b>", styles["body"]), Paragraph(v, styles["body"])] for k, v in meta_rows],
        colWidths=[Layout.CONTENT_WIDTH * 0.32, Layout.CONTENT_WIDTH * 0.68],
    )
    meta_table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1, Palette.BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, Palette.BORDER),
        ("BACKGROUND", (0, 0), (0, -1), Palette.LIGHT_BG),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 50))
    story.append(Paragraph(f"<font size=8 color='#94A3B8'>{ReportMeta.FOOTER_DISCLAIMER}</font>", styles["subtitle"]))
    return story


def _build_summary_section(styles, assessment_data: Dict[str, Any], findings: List[Dict[str, Any]]) -> list:
    from reportlab.platypus import Paragraph, Spacer, Table, TableStyle

    story = []
    score = assessment_data.get("overall_score", 0.0)
    crit = assessment_data.get("critical_count", 0)
    high = assessment_data.get("high_count", 0)
    med = assessment_data.get("medium_count", 0)
    low = assessment_data.get("low_count", 0)
    score_color_hex = Palette.score_color_hex(score)

    summary_box_data = [[
        Paragraph(
            f"<b>Overall Security Score</b><br/>"
            f"<font size=27 color='{score_color_hex}'><br/><b>{score} / 100</b></font>",
            styles["score_value"],
        ),
        Paragraph(
            f"<b>Findings Overview</b><br/>"
            f"<b>Total Findings:</b> {len(findings)}<br/>"
            f"<b>Devices Assessed:</b> {assessment_data.get('total_devices', 0)}",
            styles["body"],
        ),
        Paragraph(
            f"<b>Severity Distribution</b><br/>"
            f"<font color='#DC2626'><b>Critical:</b> {crit}</font><br/>"
            f"<font color='#EA580C'><b>High:</b> {high}</font><br/>"
            f"<font color='#D97706'><b>Medium:</b> {med}</font><br/>"
            f"<font color='#16A34A'><b>Low:</b> {low}</font>",
            styles["body"],
        ),
    ]]
    summary_table = Table(
        summary_box_data,
        colWidths=[Layout.CONTENT_WIDTH * 0.28, Layout.CONTENT_WIDTH * 0.36, Layout.CONTENT_WIDTH * 0.36],
    )
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), Palette.LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 1, Palette.BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, Palette.BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Executive Summary & AI Threat Analysis", styles["h2"]))
    story.append(Paragraph(assessment_data.get("executive_summary", "Assessment complete."), styles["body"]))
    story.append(Spacer(1, 6))

    ai_insights = assessment_data.get("ai_insights", {})
    correlated_chains = ai_insights.get("correlated_attack_chains", []) if isinstance(ai_insights, dict) else []
    if correlated_chains:
        story.append(Paragraph("<b>Correlated Multi-Stage Attack Vectors:</b>", styles["body"]))
        for chain in correlated_chains[:2]:
            story.append(Paragraph(
                f"\u2022 <b>[{chain.get('severity', 'HIGH')}] {chain.get('attack_chain_title', 'Attack Vector')}:</b> "
                f"{chain.get('description', '')}",
                styles["body"],
            ))
            story.append(Spacer(1, 3))
        story.append(Spacer(1, 4))

    return story


def _build_category_table(styles, category_scores: List[Dict[str, Any]]) -> list:
    from reportlab.lib import colors
    from reportlab.platypus import Paragraph, Spacer, Table, TableStyle, KeepTogether

    if not category_scores:
        return []

    block = [Paragraph("Compliance Domain Breakdown", styles["h2"])]
    data = [["Compliance Category", "Score", "Findings", "Status"]]
    for cat in category_scores:
        c_score = cat.get("score", 0.0)
        data.append([cat.get("category", "General"), f"{c_score}%", str(cat.get("findings_count", 0)), _status_for_score(c_score)])

    col_widths = [w * Layout.CONTENT_WIDTH for w in (0.40, 0.20, 0.20, 0.20)]
    table = Table(data, colWidths=col_widths)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), Palette.SECONDARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, Palette.LIGHT_BG]),
        ("GRID", (0, 0), (-1, -1), 0.5, Palette.BORDER),
        ("ALIGN", (1, 0), (2, -1), "CENTER"),
    ]))
    block.append(table)
    block.append(Spacer(1, 10))
    # KeepTogether: heading + table always travel together -- fix #1.
    return [KeepTogether(block)]


def _build_device_table(styles, devices: List[Dict[str, Any]]) -> list:
    from reportlab.lib import colors
    from reportlab.platypus import Paragraph, Table, TableStyle, KeepTogether

    block = [Paragraph("Device Inventory & Individual Posture", styles["h2"])]
    data = [["Hostname / File", "Vendor", "Score", "Crit", "High", "Med", "Low"]]
    for dev in devices:
        data.append([
            dev.get("hostname") or dev.get("filename", "Unknown"),
            dev.get("vendor", "Unknown"),
            f"{dev.get('security_score', 0)}%",
            str(dev.get("critical_count", 0)),
            str(dev.get("high_count", 0)),
            str(dev.get("medium_count", 0)),
            str(dev.get("low_count", 0)),
        ])

    col_widths = [w * Layout.CONTENT_WIDTH for w in (0.32, 0.18, 0.14, 0.09, 0.09, 0.09, 0.09)]
    table = Table(data, colWidths=col_widths)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), Palette.PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, Palette.LIGHT_BG]),
        ("GRID", (0, 0), (-1, -1), 0.5, Palette.BORDER),
        ("ALIGN", (2, 0), (-1, -1), "CENTER"),
    ]))
    block.append(table)
    # KeepTogether: heading + table always travel together -- fix #1.
    return [KeepTogether(block)]


def _build_code_box(styles, remediation_script: str):
    """CLI snippet as a single-cell table (not a Paragraph w/ backColor) -- fix #2."""
    from reportlab.platypus import Paragraph, Table, TableStyle

    label = Paragraph(
        f"<b>Vendor CLI Remediation Command:</b><br/>{_as_html_lines(remediation_script)}",
        styles["code"],
    )
    box = Table([[label]], colWidths=[Layout.CONTENT_WIDTH])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), Palette.LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, Palette.BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return box


def _build_finding_block(styles, idx: int, finding: Dict[str, Any]) -> list:
    from reportlab.platypus import Paragraph, Spacer, HRFlowable
    from reportlab.lib.styles import ParagraphStyle

    severity = finding.get("severity", "INFO")
    title_style = ParagraphStyle(
        f"FindingTitle{idx}", fontName="Helvetica-Bold", fontSize=10.5, leading=13,
        textColor=Palette.severity_color(severity),
    )

    block = [
        Paragraph(
            f"<b>#{idx}. [{severity}] {finding.get('title', 'Security Finding')}</b> "
            f"(Rule: {finding.get('rule_id', 'N/A')})",
            title_style,
        ),
        Paragraph(
            f"<b>Category:</b> {finding.get('category', 'General')} | "
            f"<b>Standard Ref:</b> {finding.get('cis_reference') or 'CIS / NIST Hardening Baseline'}",
            styles["subtitle"],
        ),
        Spacer(1, 3),
        Paragraph(f"<b>Explanation:</b> {finding.get('explanation', '')}", styles["body"]),
        Paragraph(
            f"<b>Masked Evidence:</b> <font name='Courier' color='#0F172A'>{finding.get('evidence', 'None')}</font>",
            styles["body"],
        ),
        Paragraph(f"<b>Remediation Recommendation:</b> {finding.get('recommendation', '')}", styles["body"]),
    ]

    remediation_script = finding.get("remediation_script")
    if remediation_script:
        block.append(Spacer(1, 4))
        block.append(_build_code_box(styles, remediation_script))

    block.append(HRFlowable(width="100%", thickness=0.5, color=Palette.BORDER, spaceBefore=8, spaceAfter=8))
    return block


def _build_findings_section(styles, findings: List[Dict[str, Any]]) -> list:
    from reportlab.platypus import Paragraph, Spacer, KeepTogether, CondPageBreak

    story = [
        # CondPageBreak (not PageBreak!): only starts a new page when there
        # truly isn't room left for the header + intro + first finding --
        # fix #1, part 2.
        CondPageBreak(Layout.FINDINGS_SECTION_MIN_SPACE),
        Paragraph("Detailed Security Findings & Remediation Guidance", styles["h2"]),
        Paragraph(f"<i>{ReportMeta.SANITIZATION_NOTICE}</i>", styles["subtitle"]),
        Spacer(1, 8),
    ]

    for idx, finding in enumerate(findings[:Layout.MAX_FINDINGS_RENDERED], 1):
        story.append(KeepTogether(_build_finding_block(styles, idx, finding)))

    if len(findings) > Layout.MAX_FINDINGS_RENDERED:
        remaining = len(findings) - Layout.MAX_FINDINGS_RENDERED
        story.append(Paragraph(
            f"<i>+ {remaining} additional lower-priority finding(s) omitted from this "
            f"summary report. Refer to the full findings export for the complete list.</i>",
            styles["subtitle"],
        ))

    return story


# ============================================================================
# Public entry point
# ============================================================================

class AuditReportGenerator:
    """
    Enterprise PDF Audit Report Generator.
    Uses ReportLab to generate professional compliance audit documentation.
    Guarantees that no raw configuration secrets appear in the generated report
    (the underlying data must already be sanitized upstream by
    app.security.sanitizer - this class only renders what it's given).
    """

    @classmethod
    def generate_pdf(
        cls,
        assessment_data: Dict[str, Any],
        devices: List[Dict[str, Any]],
        findings: List[Dict[str, Any]],
        category_scores: List[Dict[str, Any]],
    ) -> bytes:
        try:
            from reportlab.platypus import SimpleDocTemplate, PageBreak
        except ImportError:
            return cls._generate_fallback_text_report(assessment_data, devices, findings)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=Layout.PAGE_SIZE,
            leftMargin=Layout.MARGIN_LEFT,
            rightMargin=Layout.MARGIN_RIGHT,
            topMargin=Layout.MARGIN_TOP,
            bottomMargin=Layout.MARGIN_BOTTOM,
            title="NetGuard AI Security Audit Report",
            author="NetGuard AI",
        )
        styles = _build_styles()

        story: list = []
        story.extend(_build_cover_page(styles, assessment_data, devices))
        story.append(PageBreak())
        story.extend(_build_summary_section(styles, assessment_data, findings))
        story.extend(_build_category_table(styles, category_scores))
        story.extend(_build_device_table(styles, devices))
        story.extend(_build_findings_section(styles, findings))

        NumberedCanvas = _make_numbered_canvas()
        doc.build(story, canvasmaker=NumberedCanvas)
        buffer.seek(0)
        return buffer.getvalue()

    @classmethod
    def _generate_fallback_text_report(
        cls,
        assessment_data: Dict[str, Any],
        devices: List[Dict[str, Any]],
        findings: List[Dict[str, Any]],
    ) -> bytes:
        lines = [
            "NETGUARD AI - SECURITY AUDIT REPORT",
            "=" * 50,
            f"Assessment ID: {assessment_data.get('id', 'N/A')}",
            f"Overall Score: {assessment_data.get('overall_score', 0)}/100",
            f"Total Devices: {assessment_data.get('total_devices', 0)}",
            f"Critical: {assessment_data.get('critical_count', 0)} | "
            f"High: {assessment_data.get('high_count', 0)} | "
            f"Medium: {assessment_data.get('medium_count', 0)} | "
            f"Low: {assessment_data.get('low_count', 0)}",
            "",
            "EXECUTIVE SUMMARY:",
            assessment_data.get("executive_summary", "N/A"),
            "",
            f"FINDINGS ({len(findings)} total):",
        ]
        for f in findings:
            lines += [
                "",
                f"[{f.get('severity')}] {f.get('title')} ({f.get('rule_id')})",
                f"Category: {f.get('category')}",
                f"Evidence: {f.get('evidence')}",
                f"Recommendation: {f.get('recommendation')}",
                "-" * 50,
            ]
        return "\n".join(lines).encode("utf-8")
