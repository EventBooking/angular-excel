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
    v: any;
    t: string;
}
declare class DateCell implements ICell {
    constructor(value?: any);
    v: any;
    t: string;
}
declare class StringCell implements ICell {
    constructor(value?: any);
    v: any;
    t: string;
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
    addWorkSheet(name: string): IWorkSheet;
}
declare class WorkBook implements IWorkBook {
    private xlsx;
    constructor(xlsx: any);
    addWorkSheet(name: string): IWorkSheet;
    private _sheetNames;
    private _sheets;
}
interface IExcelConverter {
    create(): IWorkBook;
    saveAs(name: string, workbook: IWorkBook): any;
}
declare class ExcelConverter implements IExcelConverter {
    private _saveAs;
    private xlsx;
    static $inject: string[];
    constructor(_saveAs: any, xlsx: any);
    create(): IWorkBook;
    saveAs(name: string, workbook: IWorkBook): void;
    private convertToBinary(workbook);
}
interface IExcelBuilder<T> {
    addDateColumn(name: string, expression: (x: T) => any): IExcelBuilder<T>;
    addColumn(name: string, expression: (x: T) => any, createCell?: (x: any) => ICell): IExcelBuilder<T>;
    build(): IWorkBook;
}
declare class ExcelBuilder<T> implements IExcelBuilder<T> {
    private excelConverter;
    private fileName;
    private values;
    constructor(excelConverter: IExcelConverter, fileName: string, values: T[]);
    addDateColumn(name: string, expression: (x: T) => any): IExcelBuilder<T>;
    addColumn(name: string, expression: (x: T) => any, createCell?: (x: any) => ICell): IExcelBuilder<T>;
    build(): IWorkBook;
    private columns;
}
