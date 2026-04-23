export type ReportCell = string | number | boolean | null | undefined;

export type ReportMetric = {
  label: string;
  value: string;
};

export type ReportTable = {
  title: string;
  columns: string[];
  rows: ReportCell[][];
};

export type ReportDocument = {
  title: string;
  subtitle: string;
  generatedAt: string;
  metrics?: ReportMetric[];
  tables: ReportTable[];
  note?: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCell(value: ReportCell): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  return String(value);
}

export function sanitizeFileNameSegment(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .replaceAll(/[^a-z0-9]+/gi, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "")
    .slice(0, 80) || "rapor";
}

function renderMetricCards(metrics: ReportMetric[]): string {
  if (metrics.length === 0) return "";
  return `
    <section class="metrics">
      ${metrics
        .map(
          (metric) => `
            <div class="metric-card">
              <div class="metric-label">${escapeHtml(metric.label)}</div>
              <div class="metric-value">${escapeHtml(metric.value)}</div>
            </div>
          `,
        )
        .join("")}
    </section>
  `;
}

function renderTable(table: ReportTable): string {
  const rows =
    table.rows.length > 0
      ? table.rows
          .map(
            (row) => `
              <tr>
                ${row
                  .map((cell) => `<td>${escapeHtml(formatCell(cell))}</td>`)
                  .join("")}
              </tr>
            `,
          )
          .join("")
      : `
          <tr>
            <td colspan="${Math.max(1, table.columns.length)}" class="empty-row">Kayıt bulunamadı</td>
          </tr>
        `;

  return `
    <section class="report-section">
      <h2>${escapeHtml(table.title)}</h2>
      <table>
        <thead>
          <tr>
            ${table.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function renderDocument(report: ReportDocument, mode: "excel" | "print"): string {
  const metrics = renderMetricCards(report.metrics ?? []);
  const tables = report.tables.map((table) => renderTable(table)).join("");
  const pageBreakRule = mode === "print" ? ".report-section { break-inside: avoid; }" : "";

  return `
    <!DOCTYPE html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(report.title)}</title>
        <style>
          body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 24px;
            color: #111827;
            background: #ffffff;
          }
          h1 {
            margin: 0 0 6px;
            font-size: 24px;
          }
          h2 {
            margin: 0 0 10px;
            font-size: 16px;
          }
          p {
            margin: 0;
          }
          .header {
            margin-bottom: 20px;
            padding-bottom: 14px;
            border-bottom: 2px solid #d1d5db;
          }
          .subtitle {
            color: #4b5563;
            margin-top: 4px;
            font-size: 13px;
          }
          .generated-at {
            color: #6b7280;
            margin-top: 8px;
            font-size: 12px;
          }
          .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin-bottom: 18px;
          }
          .metric-card {
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 10px 12px;
            background: #f9fafb;
          }
          .metric-label {
            color: #6b7280;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .metric-value {
            margin-top: 6px;
            font-size: 18px;
            font-weight: 700;
          }
          .report-section {
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px;
            font-size: 12px;
            text-align: left;
            vertical-align: top;
            word-wrap: break-word;
          }
          th {
            background: #eef2ff;
            font-weight: 700;
          }
          .empty-row {
            color: #6b7280;
            text-align: center;
            padding: 18px 8px;
          }
          .note {
            margin-top: 18px;
            color: #6b7280;
            font-size: 11px;
          }
          ${pageBreakRule}
          @media print {
            body {
              margin: 12mm;
            }
            .header {
              border-bottom-color: #9ca3af;
            }
          }
        </style>
      </head>
      <body>
        <header class="header">
          <h1>${escapeHtml(report.title)}</h1>
          <p class="subtitle">${escapeHtml(report.subtitle)}</p>
          <p class="generated-at">Oluşturulma: ${escapeHtml(report.generatedAt)}</p>
        </header>
        ${metrics}
        ${tables}
        ${
          report.note
            ? `<p class="note">${escapeHtml(report.note)}</p>`
            : ""
        }
      </body>
    </html>
  `;
}

export function buildExcelReportHtml(report: ReportDocument): string {
  return renderDocument(report, "excel");
}

export function buildPrintReportHtml(report: ReportDocument): string {
  return renderDocument(report, "print");
}

export function downloadReportAsExcel(report: ReportDocument, fileNameBase: string): void {
  const content = `\ufeff${buildExcelReportHtml(report)}`;
  const blob = new Blob([content], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${sanitizeFileNameSegment(fileNameBase)}.xls`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function openReportAsPdf(report: ReportDocument): boolean {
  const popup = window.open("", "_blank", "noopener,noreferrer,width=1280,height=900");
  if (!popup) return false;

  popup.document.open();
  popup.document.write(buildPrintReportHtml(report));
  popup.document.close();

  const triggerPrint = () => {
    popup.focus();
    popup.print();
  };

  popup.onload = () => {
    window.setTimeout(triggerPrint, 250);
  };
  window.setTimeout(triggerPrint, 500);

  return true;
}
