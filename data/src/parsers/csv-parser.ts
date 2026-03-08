import { parse } from "csv-parse/sync";

export interface CsvOptions {
  delimiter?: string;
  columns?: boolean | string[];
  skipEmptyLines?: boolean;
}

export function parseCsv<T>(content: string, options: CsvOptions = {}): T[] {
  return parse(content, {
    delimiter: options.delimiter ?? ";",
    columns: options.columns ?? true,
    skip_empty_lines: options.skipEmptyLines ?? true,
    trim: true,
  });
}
