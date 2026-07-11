/** Minimal RFC 4180 CSV parser: comma-delimited, double-quote quoting, `""` as an
 * escaped quote inside a quoted field. Handles \n and \r\n line endings and a
 * missing trailing newline. Returns one array of cells per row, header included. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      endField();
    } else if (char === "\n") {
      endRow();
    } else if (char === "\r") {
      // Skip; the following \n (or end of input) closes the row.
    } else {
      field += char;
    }
  }

  // Flush a final row that wasn't terminated by a trailing newline.
  if (field !== "" || row.length > 0) {
    endRow();
  }

  return rows;
}
