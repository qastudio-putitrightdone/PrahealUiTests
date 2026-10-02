import { expect, Locator } from '@playwright/test';
import { BaseElement, Timeout } from './BaseElement';

export interface TableOptions {
  headerSelector?: string;
  rowSelector?: string;
  cellSelector?: string;
}

export type Column = number | string;

export class Table extends BaseElement {
  private readonly headerSelector: string;
  private readonly rowSelector: string;
  private readonly cellSelector: string;

  constructor(root: Locator, options: TableOptions = {}) {
    super(root);
    this.headerSelector = options.headerSelector ?? 'thead th';
    this.rowSelector = options.rowSelector ?? 'tbody tr';
    this.cellSelector = options.cellSelector ?? 'td';
  }

  get headers(): Locator {
    return this.root.locator(this.headerSelector);
  }

  get rows(): Locator {
    return this.root.locator(this.rowSelector);
  }

  row(index: number): Locator {
    return this.rows.nth(index);
  }

  rowsWithText(text: string | RegExp): Locator {
    return this.rows.filter({ hasText: text });
  }

  private async headerTexts(): Promise<string[]> {
    await this.headers.first().waitFor();
    return (await this.headers.allInnerTexts()).map((t) => t.trim());
  }

  private async columnIndex(column: Column): Promise<number> {
    if (typeof column === 'number') return column;
    const headers = await this.headerTexts();
    const index = headers.indexOf(column);
    if (index === -1) {
      throw new Error(`${this.name}: column "${column}" not found. Available: ${headers.join(', ')}`);
    }
    return index;
  }

  private async cell(row: number, column: Column): Promise<Locator> {
    return this.row(row).locator(this.cellSelector).nth(await this.columnIndex(column));
  }

  private async columnCells(column: Column): Promise<Locator> {
    return this.rows.locator(`${this.cellSelector}:nth-child(${(await this.columnIndex(column)) + 1})`);
  }

  private async rowData(row: number): Promise<Record<string, string>> {
    const headers = await this.headerTexts();
    const cells = (await this.row(row).locator(this.cellSelector).allInnerTexts()).map((t) => t.trim());
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']));
  }

  async getHeaders(): Promise<string[]> {
    await this.flush();
    return this.headerTexts();
  }

  async getRowCount(): Promise<number> {
    await this.flush();
    return this.rows.count();
  }

  async getCellText(row: number, column: Column): Promise<string> {
    await this.flush();
    return (await (await this.cell(row, column)).innerText()).trim();
  }

  async getColumnValues(column: Column): Promise<string[]> {
    await this.flush();
    return (await (await this.columnCells(column)).allInnerTexts()).map((t) => t.trim());
  }

  async getRowData(row: number): Promise<Record<string, string>> {
    await this.flush();
    return this.rowData(row);
  }

  async getTableData(): Promise<Record<string, string>[]> {
    await this.flush();
    const rowCount = await this.rows.count();
    const data: Record<string, string>[] = [];
    for (let i = 0; i < rowCount; i++) data.push(await this.rowData(i));
    return data;
  }

  async findRowIndex(column: Column, value: string): Promise<number> {
    return (await this.getColumnValues(column)).indexOf(value);
  }

  clickCell(row: number, column: Column, options?: Timeout): this {
    return this.chain(async () => (await this.cell(row, column)).click(options));
  }

  checkHasRowCount(count: number, options?: Timeout): this {
    return this.chain(() => expect(this.rows, `${this.name} should have ${count} rows`).toHaveCount(count, options));
  }

  checkHasHeaders(headers: (string | RegExp)[], options?: Timeout): this {
    return this.chain(() =>
      expect(this.headers, `${this.name} should have headers ${headers.join(', ')}`).toHaveText(headers, options),
    );
  }

  checkContainsRow(text: string | RegExp, options?: Timeout): this {
    return this.chain(() =>
      expect(this.rowsWithText(text), `${this.name} should contain a row with ${String(text)}`).not.toHaveCount(
        0,
        options,
      ),
    );
  }

  checkDoesNotContainRow(text: string | RegExp, options?: Timeout): this {
    return this.chain(() =>
      expect(this.rowsWithText(text), `${this.name} should not contain a row with ${String(text)}`).toHaveCount(
        0,
        options,
      ),
    );
  }

  checkHasCellText(row: number, column: Column, text: string | RegExp, options?: Timeout): this {
    return this.chain(async () =>
      expect(
        await this.cell(row, column),
        `${this.name} cell [${row}, ${String(column)}] should have text ${String(text)}`,
      ).toHaveText(text, options),
    );
  }

  checkHasColumnValues(column: Column, values: (string | RegExp)[], options?: Timeout): this {
    return this.chain(async () =>
      expect(
        await this.columnCells(column),
        `${this.name} column ${String(column)} should have values ${values.join(', ')}`,
      ).toHaveText(values, options),
    );
  }
}
