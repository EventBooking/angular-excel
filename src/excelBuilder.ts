interface IExcelBuilder {
    setCurrency(currency: string): IExcelBuilder;
    setName(name: string): IExcelBuilder;
    addRow(row: IExcelRow): IExcelBuilder;
    addRows(rows: IExcelRow[]): IExcelBuilder
    build(): IWorkSheet;
}

class ExcelBuilder implements IExcelBuilder {
    constructor() {
        this.rows = [];
    }

    setCurrency(currency: string): IExcelBuilder {
        this.currencyFormat = ExcelUtils.getCurrencyFormat(currency);
        return this;
    }

    setName(name: string): IExcelBuilder {
        this.name = name;
        return this;
    }

    addRow(row: IExcelRow): IExcelBuilder {
        this.rows.push(row);
        return this;
    }

    addRows(rows: IExcelRow[]): IExcelBuilder {
        rows.forEach( x => this.addRow(x));
        return this;
    }

    build(): IWorkSheet {
        var worksheet = new WorkSheet(this.name);

        this.rows.forEach((row, rowIdx) => {
            row.cells.forEach((cell, cellIdx) => {
                if(cell instanceof CurrencyCell)
                    cell.setFormat(this.currencyFormat);
                worksheet.setCell(rowIdx, cellIdx, null, cell);
            });
        });

        return worksheet;
    }

    private currencyFormat: string;
    name: string;
    private rows: IExcelRow[];
}

interface IExcelRow {
    addEmpty(count?:number): IExcelRow;
    addString(value?: string): IExcelRow;
    addStrings(values: string[]): IExcelRow;
    addNumber(value?: number): IExcelRow;
    addNumbers(values: number[]): IExcelRow;
    addCurrency(value?: number): IExcelRow;
    addCurrencies(values: number[]): IExcelRow;
    addDate(isoDate?: string): IExcelRow;
    addDates(isoDates: string[]): IExcelRow;
    addTime(isoTime?: string): IExcelRow;
    addTimes(isoTimes: string[]): IExcelRow;
    addCell(cell: ICell): IExcelRow;
    addCells(cells: ICell[]): IExcelRow;
    cells: ICell[];
}

class ExcelRow implements IExcelRow {
    constructor() {
        this.cells = [];
    }

    addEmpty(count:number = 1): IExcelRow {
        for(let i=0; i<count; i++)
            return this.addString();
    }

    addString(value?: string): IExcelRow {
        return this.addCell(new StringCell(value));
    }

    addStrings(values: string[]): IExcelRow {
        values.forEach( x => this.addString(x));
        return this;
    }

    addNumber(value?: number): IExcelRow {
        return this.addCell(new NumberCell(value));
    }

    addNumbers(values: number[]): IExcelRow {
        values.forEach( x => this.addNumber(x));
        return this;
    }

    addCurrency(value?: number, format?: string): IExcelRow {
        return this.addCell(new CurrencyCell(value, format));
    }

    addCurrencies(values: number[]): IExcelRow {
        values.forEach( x => this.addCurrency(x));
        return this;
    }

    addDate(isoDate?: string): IExcelRow {
        return this.addCell(new DateCell(isoDate));
    }

    addDates(isoDates: string[]): IExcelRow {
        isoDates.forEach( x => this.addDate(x));
        return this;
    }

    addTime(isoTime?: string, format?: string): IExcelRow {
        return this.addCell(new TimeCell(isoTime, format));
    }

    addTimes(isoTimes: string[]): IExcelRow {
        isoTimes.forEach( x => this.addTime(x));
        return this;
    }

    addCell(cell: ICell): IExcelRow {
        this.cells.push(cell);
        return this;
    }

    addCells(cells: ICell[]): IExcelRow {
        cells.forEach( x => this.addCell(x));
        return this;
    }

    public cells: ICell[];
}