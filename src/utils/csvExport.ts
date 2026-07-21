const escapeCsvField = (value: string | number) => {
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const toCsvRow = (fields: Array<string | number>) =>
  fields.map(escapeCsvField).join(",");

export const buildCsv = (
  headers: string[],
  rows: Array<Array<string | number>>
) => [toCsvRow(headers), ...rows.map(toCsvRow)].join("\n");

export const downloadCsv = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
