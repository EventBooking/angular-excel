interface IWorkSheetBuilder<T> {
    addTimeColumn(name: string, expression: (x: T) => any, format?: string): IWorkSheetBuilder<T>
    addDateColumn(name: string, expression: (x: T) => any): IWorkSheetBuilder<T>;
    addNumberColumn(name: string, expression: (x: T) => any): IWorkSheetBuilder<T>
    addColumn(name: string, expression: (x: T) => any, createCell?: (x: any) => ICell): IWorkSheetBuilder<T>;
    setName(name: string): IWorkSheetBuilder<T>;
    setTimeZone(timeZone: string): IWorkSheetBuilder<T>;
    build(): IWorkSheet;
}

class WorkSheetBuilder<T> implements IWorkSheetBuilder<T> {
    constructor(
        private xlsx: any,
        private moment: any,
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
            createCell: x => {
                let value = !this.timeZone ? x : this.moment(x, 'YYYY-MM-DD').tz(this.timeZone).format('YYYY-MM-DD HH:mm:ss');
                return new DateCell(value);
            }
        });
        return this;
    }

    addNumberColumn(name: string, expression: (x: T) => any): IWorkSheetBuilder<T> {
        this.columns.push({ name: name, expression: expression, createCell: x => new NumberCell(x) });
        return this;
    }

    addColumn(name: string, expression: (x: T) => any, createCell?: (x: any) => ICell): IWorkSheetBuilder<T> {
        this.columns.push({ name: name, expression: expression, createCell: createCell });
        return this;
    }

    setTimeZone(timeZone: string): IWorkSheetBuilder<T> {
        this.timeZone = timeZone;
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
                const cell = column.createCell ? column.createCell(value) : null;
                worksheet.setCell(rowIdx + 1, colIdx, value, cell);
            }
        });

        return worksheet;
    }

    private name: string;
    private timeZone: string;
    private columns: { name: string, expression: (x: T) => any, createCell?: (x: any) => ICell }[];
}