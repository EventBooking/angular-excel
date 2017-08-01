interface IWorkSheetBuilder<T> {
    addDateColumn(name: string, expression: (x: T) => any): IWorkSheetBuilder<T>;
    addColumn(name: string, expression: (x: T) => any, createCell?: (x: any) => ICell): IWorkSheetBuilder<T>;
    setName(name: string): IWorkSheetBuilder<T>;
    setWorkbook(workbook: IWorkBook): IWorkSheetBuilder<T>;
    build(): IWorkSheet;
}

class WorkSheetBuilder<T> implements IWorkSheetBuilder<T> {
    constructor(
        private xlsx: any,
        private values: T[]
    ) {
        this.columns = [];
    }

    addDateColumn(name: string, expression: (x: T) => any): IWorkSheetBuilder<T> {
        this.columns.push({ name: name, expression: expression, createCell: x => new DateCell(x) });
        return this;
    }

    addColumn(name: string, expression: (x: T) => any, createCell?: (x: any) => ICell): IWorkSheetBuilder<T> {
        this.columns.push({ name: name, expression: expression, createCell: createCell });
        return this;
    }

    setName(name: string): IWorkSheetBuilder<T> {
        this.name = name;
        return this;
    }

    setWorkbook(workbook: IWorkBook): IWorkSheetBuilder<T> {
        this.workbook = workbook;
        return this;
    }

    build(): IWorkSheet {
        var worksheet = this.workbook ? this.workbook.addWorkSheet(this.name) : new WorkSheet(this.name, this.xlsx);

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
    private workbook: IWorkBook;
    private columns: { name: string, expression: (x: T) => any, createCell?: (x: any) => ICell }[];
}