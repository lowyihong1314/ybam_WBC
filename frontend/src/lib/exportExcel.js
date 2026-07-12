const REGISTER_COLUMNS = [
  ["id", (record) => record.id],
  ["version", (record) => record.version],
  ["created_at", (record) => record.created_at],
  ["deleted", (record) => record.deleted],
  ["validfy", (record) => record.validfy],
  ["doc_type", (record) => record.doc_type],
  ["doc_no", (record) => record.doc_no],
  ["name", (record) => record.name],
  ["name_cn", (record) => record.name_cn],
  ["email", (record) => record.email],
  ["phone", (record) => record.phone],
  ["country", (record) => record.country],
  ["age", (record) => record.age],
  ["emergency_contact", (record) => record.emergency_contact],
  ["medical_information", (record) => record.medical_information],
  ["payment_amount", (record) => record.payment_amount],
  ["payment_currency", (record) => record.payment_currency],
  ["participant_category", (record) => record.participant_category],
  ["original_payment_amount", (record) => record.original_payment_amount],
  ["original_payment_currency", (record) => record.original_payment_currency],
  ["exchange_rate", (record) => record.exchange_rate],
  ["exchange_rate_date", (record) => record.exchange_rate_date],
  ["registration_group", (record) => record.registration_group],
  ["gender", (record) => record.gender],
  ["state_region", (record) => record.state_region],
  ["organization", (record) => record.organization],
  ["project_name", (record) => record.project_name],
  ["helper_count", (record) => record.helper_count],
  ["helper_names", (record) => record.helper_names],
  ["special_request", (record) => record.special_request],
  ["accommodation_required", (record) => record.accommodation_required],
  ["roommate_name", (record) => record.roommate_name],
  ["roommate_doc_no", (record) => record.roommate_doc_no],
  ["accommodation_paid", (record) => record.accommodation_paid],
  ["accommodation_bill_id", (record) => record.accommodation_bill_id],
  ["accommodation_bill_url", (record) => record.accommodation_bill_url],
  ["paper_presentation", (record) => record.paper_presentation],
  ["paper_title", (record) => record.paper_title],
  ["abstract", (record) => record.abstract],
  ["paper_files", (record) => (record.paper_files || []).join(", ")],
  ["payment_doc", (record) => record.payment_doc],
  ["is_student", (record) => record.is_student],
  ["student_card_no", (record) => record.student_card_no],
  ["student_card_expiry", (record) => record.student_card_expiry],
  ["student_school", (record) => record.student_school],
  ["student_card_image", (record) => record.student_card_image],
  ["payment_transaction_count", (record) => (record.payment_transactions || []).length],
];

const TRANSACTION_COLUMNS = [
  ["id", ({ transaction }) => transaction.id],
  ["version", ({ transaction }) => transaction.version],
  ["register_id", ({ transaction, record }) => transaction.register_id || record.id],
  ["register_name", ({ record }) => record.name || ""],
  ["register_email", ({ record }) => record.email || ""],
  ["bill_id", ({ transaction }) => transaction.bill_id],
  ["purpose", ({ transaction }) => transaction.purpose || transaction.raw_json?.purpose || ""],
  ["paid", ({ transaction }) => transaction.paid],
  ["created_at", ({ transaction }) => transaction.created_at],
  ["raw_json", ({ transaction }) => JSON.stringify(transaction.raw_json || "")],
];

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sheetName(name) {
  return escapeXml(String(name).slice(0, 31));
}

function cell(value) {
  return `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
}

function row(values) {
  return `<Row>${values.map(cell).join("")}</Row>`;
}

function worksheet(name, rows) {
  return `<Worksheet ss:Name="${sheetName(name)}"><Table>${rows.map(row).join("")}</Table></Worksheet>`;
}

function registrationRows(records) {
  return [
    REGISTER_COLUMNS.map(([header]) => header),
    ...records.map((record) => REGISTER_COLUMNS.map(([, getter]) => getter(record))),
  ];
}

function transactionRows(records) {
  const rows = records.flatMap((record) =>
    (record.payment_transactions || []).map((transaction) => ({ record, transaction })),
  );

  return [
    TRANSACTION_COLUMNS.map(([header]) => header),
    ...rows.map((entry) => TRANSACTION_COLUMNS.map(([, getter]) => getter(entry))),
  ];
}

function workbookXml(records) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Top"/>
      <Font ss:FontName="Arial" ss:Size="10"/>
    </Style>
  </Styles>
  ${worksheet("Registrations", registrationRows(records))}
  ${worksheet("Transactions", transactionRows(records))}
</Workbook>`;
}

export function exportRecordsWorkbook(records, version) {
  const xml = workbookXml(records);
  const blob = new Blob([xml], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${version || "ybam"}_all_data.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
