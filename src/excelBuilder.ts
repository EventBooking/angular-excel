interface IExcelBuilder {
    setCurrency(currency: string);
    setName(name: string);
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
    addEmpty(): IExcelRow;
    addString(value?: string): IExcelRow;
    addNumber(value?: any): IExcelRow;
    addCurrency(value?: number): IExcelRow;
    addDate(isoDate?: string): IExcelRow;
    addTime(isoTime?: string): IExcelRow;
    addCell(cell: ICell): IExcelRow;
    cells: ICell[];
}

class ExcelRow implements IExcelRow {
    constructor() {
        this.cells = [];
    }

    addEmpty(): IExcelRow {
        return this.addString();
    }

    addString(value?: string): IExcelRow {
        return this.addCell(new StringCell(value));
    }

    addNumber(value?: any): IExcelRow {
        return this.addCell(new NumberCell(value));
    }

    addCurrency(value?: number, format?: string): IExcelRow {
        return this.addCell(new CurrencyCell(value, format));
    }

    addDate(isoDate?: string): IExcelRow {
        return this.addCell(new DateCell(isoDate));
    }

    addTime(isoTime?: string, format?: string): IExcelRow {
        return this.addCell(new TimeCell(isoTime, format));
    }

    addCell(cell: ICell): IExcelRow {
        this.cells.push(cell);
        return this;
    }

    public cells: ICell[];
}