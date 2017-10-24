declare namespace excel {
}
declare class ExcelUtils {
    private static saveAs;
    private static xlsx;
    private static currency;
    private static accounting;
    static bootstrap(saveAs: any, xlsx: any, currency: any, accounting: any): void;
    static encodeCell(address: ICellAddress): any;
    static encodeRange(range: ICellRange): any;
    static getCurrencyFormat(currency: string): string;
    static formatTime(isoTime: string): number;
    static convertToBinary(workbook: string): ArrayBuffer;
    static writeWorkbook(workbook: IWorkBook, options?: any, enableLegacySafariSupport?: boolean): string;
    static saveBuffer(name: string, buffer: ArrayBuffer): void;
}
interface ICellAddress {
    c: number;
    r: number;
}
declare class CellAddress implements ICellAddress {
    constructor(row: number, col: number);
    c: number;
    r: number;
}
interface ICellRange {
    addAddress(address: ICellAddress): any;
}
declare class CellRange implements ICellRange {
    constructor();
    s: CellAddress;
    e: CellAddress;
    addAddress(address: ICellAddress): void;
}
interface ICell {
    v: string;
    w: string;
    t: string;
    f: string;
    F: string;
    r: string;
    h: string;
    c: string;
    z: string;
    l: string;
    s: string;
}
declare class Cell implements ICell {
    protected setValue(value: any, type: string, format?: string): void;
    protected setFormat(format?: string): void;
    v: string;
    w: string;
    t: string;
    f: string;
    F: string;
    r: string;
    h: string;
    c: string;
    z: string;
    l: string;
    s: string;
}
declare class DateCell extends Cell {
    constructor(isoDate: string);
}
declare class CurrencyCell extends Cell {
    constructor(value: number, format?: string);
    setFormat(format: string): void;
}
declare class TimeCell extends Cell {
    constructor(isoTime: string, format?: string);
}
declare class NumberCell extends Cell {
    constructor(value?: any);
}
declare class StringCell extends Cell {
    constructor(value?: any);
}
interface IWorkSheet {
    name: string;
    setCell(row: number, col: number, value: any, cell?: ICell): any;
    getCell(row: number, col: number): ICell;
}
declare class WorkSheet implements IWorkSheet {
    name: any;
    constructor(name: any);
    private _range;
    setCell(row: number, col: number, value: any, cell?: ICell): void;
    getCell(row: number, col: number): ICell;
}
interface IWorkBook {
    addWorkSheet(ws: string | IWorkSheet): IWorkSheet;
    save(): any;
    saveAs(name: string): any;
}
declare class WorkBook implements IWorkBook {
    name: string;
    constructor(name?: string);
    addWorkSheet(worksheet: string | IWorkSheet): IWorkSheet;
    save(): void;
    saveAs(name: string): void;
    private _sheetNames;
    private _sheets;
}
interface IExcelBuilder {
    setCurrency(currency: string): any;
    setName(name: string): any;
}
declare class ExcelBuilder implements IExcelBuilder {
    constructor();
    setCurrency(currency: string): IExcelBuilder;
    setName(name: string): IExcelBuilder;
    addRow(row: IExcelRow): IExcelBuilder;
    build(): IWorkSheet;
    private currencyFormat;
    name: string;
    private rows;
}
interface IExcelRow {
    addEmpty(): IExcelRow;
    addString(value?: string): IExcelRow;
    addNumber(value?: any): IExcelRow;
    addCurrency(value?: number): IExcelRow;
    addDate(isoDate?: string): IExcelRow;
    addTime(isoTime?: string): IExcelRow;
    addCell(cell: ICell): IExcelRow;
    cells: ICell[];
}
declare class ExcelRow implements IExcelRow {
    constructor();
    addEmpty(): IExcelRow;
    addString(value?: string): IExcelRow;
    addNumber(value?: any): IExcelRow;
    addCurrency(value?: number, format?: string): IExcelRow;
    addDate(isoDate?: string): IExcelRow;
    addTime(isoTime?: string, format?: string): IExcelRow;
    addCell(cell: ICell): IExcelRow;
    cells: ICell[];
}
interface IWorkSheetBuilder<T> {
    addTimeColumn(name: string, expression: (x: T) => any, format?: string): IWorkSheetBuilder<T>;
    addDateColumn(name: string, expression: (x: T) => any): IWorkSheetBuilder<T>;
    addNumberColumn(name: string, expression: (x: T) => any): IWorkSheetBuilder<T>;
    addCurrencyColumn(name: string, expression: (x: T) => any, getCurrency?: (x: T) => string): IWorkSheetBuilder<T>;
    addColumn(name: string, expression: (x: T) => any, createCell?: (x: any) => ICell): IWorkSheetBuilder<T>;
    setName(name: string): IWorkSheetBuilder<T>;
    setCurrency(currencyFormat: string): IWorkSheetBuilder<T>;
    build(): IWorkSheet;
}
declare class WorkSheetBuilder<T> implements IWorkSheetBuilder<T> {
    private values;
    constructor(values: T[]);
    addTimeColumn(name: string, expression: (x: T) => any, format?: string): IWorkSheetBuilder<T>;
    addDateColumn(name: string, expression: (x: T) => any): IWorkSheetBuilder<T>;
    addNumberColumn(name: string, expression: (x: T) => any): IWorkSheetBuilder<T>;
    addCurrencyColumn(name: string, expression: (x: T) => any, getCurrency?: (x: T) => string): IWorkSheetBuilder<T>;
    addColumn(name: string, expression: (x: T) => any, createCell?: (x: any) => ICell): IWorkSheetBuilder<T>;
    setCurrency(currency: string): IWorkSheetBuilder<T>;
    setName(name: string): IWorkSheetBuilder<T>;
    build(): IWorkSheet;
    private name;
    private currencyFormat;
    private columns;
}
interface IExcelConverter {
    create(): IWorkBook;
    createBuilder<T>(values: T[]): IWorkSheetBuilder<T>;
    createComplexBuilder(): IExcelBuilder;
    saveAs(name: string, workbook: IWorkBook): any;
}
declare class ExcelConverter implements IExcelConverter {
    create(): IWorkBook;
    createBuilder<T>(values: T[]): IWorkSheetBuilder<T>;
    createComplexBuilder(): IExcelBuilder;
    saveAs(name: string, workbook: IWorkBook): void;
}
