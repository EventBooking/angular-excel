interface IWorkSheetBuilder<T> {
    addTimeColumn(name: string, expression: (x: T) => any, format?: string): IWorkSheetBuilder<T>
    addDateColumn(name: string, expression: (x: T) => any): IWorkSheetBuilder<T>;
    addNumberColumn(name: string, expression: (x: T) => any): IWorkSheetBuilder<T>
    addCurrencyColumn(name: string, expression: (x: T) => any, getCurrency?: (x: T) => string): IWorkSheetBuilder<T>
    addColumn(name: string, expression: (x: T) => any, createCell?: (x: any) => ICell): IWorkSheetBuilder<T>;
    setName(name: string): IWorkSheetBuilder<T>;
    setCurrency(currencyFormat: string): IWorkSheetBuilder<T>;
    build(): IWorkSheet;
}

class WorkSheetBuilder<T> implements IWorkSheetBuilder<T> {
    constructor(
        private xlsx: any,
        private moment: any,
        private currency: any,
        private accounting: any,
        private values: T[]
    ) {
        this.columns = [];
    }

    addTimeColumn(name: string, expression: (x: T) => any, format?: string): IWorkSheetBuilder<T> {
        this.columns.push({ name: name, expression: expression, createCell: x => new TimeCell(x, format) });
        return this;
    }

    addDateColumn(name: string, expression: (x: T) => any): IWorkSheetBuilder<T> {
        this.columns.push({
            name: name,
            expression: expression,
            createCell: x => new DateCell(x)
        });
        return this;
    }

    addNumberColumn(name: string, expression: (x: T) => any): IWorkSheetBuilder<T> {
        this.columns.push({ name: name, expression: expression, createCell: x => new NumberCell(x) });
        return this;
    }

    private getCurrencyFormat(currency: string): string {
        const currencySymbol = this.currency.symbolize(currency);
        const currencySettings = this.accounting.settings.currency;
        var currencyFormat = `${currencySymbol}#${currencySettings.thousand}##0${currencySettings.decimal}00`;
        return currencyFormat;
    }

    addCurrencyColumn(name: string, expression: (x: T) => any, getCurrency?: (x: T) => string): IWorkSheetBuilder<T> {
        this.columns.push({
            name: name, expression: expression, createCell: (value, x) => {
                var format = getCurrency ? this.getCurrencyFormat(getCurrency(x)) : this.currencyFormat;
                return new CurrencyCell(value, format);
            }
        });
        return this;
    }

    addColumn(name: string, expression: (x: T) => any, createCell?: (x: any) => ICell): IWorkSheetBuilder<T> {
        this.columns.push({ name: name, expression: expression, createCell: createCell });
        return this;
    }

    setCurrency(currency: string): IWorkSheetBuilder<T> {
        this.currencyFormat = this.getCurrencyFormat(currency)
        return this;
    }

    setName(name: string): IWorkSheetBuilder<T> {
        this.name = name;
        return this;
    }

    build(): IWorkSheet {
        var worksheet = new WorkSheet(this.name, this.xlsx);

        for (let colIdx = 0; colIdx < this.columns.length; colIdx++) {
            let column = this.columns[colIdx];
            worksheet.setCell(0, colIdx, column.name);
        }

        this.values.forEach((x, rowIdx) => {
            for (let colIdx = 0; colIdx < this.columns.length; colIdx++) {
                var column = this.columns[colIdx];
                const value = column.expression(x);
                const cell = column.createCell ? column.createCell(value, x) : null;
                worksheet.setCell(rowIdx + 1, colIdx, value, cell);
            }
        });

        return worksheet;
    }

    private name: string;
    private currencyFormat: string;
    private columns: { name: string, expression: (x: T) => any, createCell?: (value: any, x: T) => ICell }[];
}