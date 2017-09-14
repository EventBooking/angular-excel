declare namespace excel {
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
declare class DateCell implements ICell {
    constructor(isoDate: string);
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
declare class CurrencyCell implements ICell {
    constructor(value: string, format: string);
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
declare class TimeCell implements ICell {
    private static SECONDS_IN_DAY;
    private static SECONDS_IN_HOUR;
    private static SECONDS_IN_MINUTE;
    constructor(isoTime: string, format?: string);
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
declare class NumberCell implements ICell {
    constructor(value: number | string);
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
declare class StringCell implements ICell {
    constructor(value: string);
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
interface IWorkSheet {
    name: string;
    setCell(row: number, col: number, value: any, cell?: ICell): any;
    getCell(row: number, col: number): ICell;
}
declare class WorkSheet implements IWorkSheet {
    name: any;
    private xlsx;
    constructor(name: any, xlsx: any);
    private _range;
    setCell(row: number, col: number, value: any, cell?: ICell): void;
    getCell(row: number, col: number): ICell;
}
interface IWorkBook {
    addWorkSheet(ws: string | IWorkSheet): IWorkSheet;
}
declare class WorkBook implements IWorkBook {
    private xlsx;
    constructor(xlsx: any);
    addWorkSheet(worksheet: string | IWorkSheet): IWorkSheet;
    private _sheetNames;
    private _sheets;
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
    private xlsx;
    private moment;
    private currency;
    private accounting;
    private values;
    constructor(xlsx: any, moment: any, currency: any, accounting: any, values: T[]);
    addTimeColumn(name: string, expression: (x: T) => any, format?: string): IWorkSheetBuilder<T>;
    addDateColumn(name: string, expression: (x: T) => any): IWorkSheetBuilder<T>;
    addNumberColumn(name: string, expression: (x: T) => any): IWorkSheetBuilder<T>;
    private getCurrencyFormat(currency);
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
    createBuilder<T>(values: T[]): WorkSheetBuilder<T>;
    saveAs(name: string, workbook: IWorkBook): any;
}
declare class ExcelConverter implements IExcelConverter {
    private _saveAs;
    private xlsx;
    private moment;
    private currency;
    private accounting;
    static $inject: string[];
    constructor(_saveAs: any, xlsx: any, moment: any, currency: any, accounting: any);
    create(): IWorkBook;
    createBuilder<T>(values: T[]): WorkSheetBuilder<T>;
    saveAs(name: string, workbook: IWorkBook): void;
    private convertToBinary(workbook);
}
