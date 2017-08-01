interface IExcelBuilder<T> {
    addDateColumn(name: string, expression: (x: T) => any): IExcelBuilder<T>;
    addColumn(name: string, expression: (x: T) => any, createCell?: (x: any) => ICell): IExcelBuilder<T>;
    build(): IWorkBook;
}

class ExcelBuilder<T> implements IExcelBuilder<T> {
    constructor(
        private excelConverter: IExcelConverter,
        private fileName: string,
        private values: T[]
    ) {
        this.columns = [];
    }

    addDateColumn(name: string, expression: (x: T) => any): IExcelBuilder<T> {
        this.columns.push({ name: name, expression: expression, createCell: x => new DateCell(x) });
        return this;
    }

    addColumn(name: string, expression: (x: T) => any, createCell?: (x: any) => ICell): IExcelBuilder<T> {
        this.columns.push({ name: name, expression: expression, createCell: createCell });
        return this;
    }

    build(): IWorkBook {
        var workbook = this.excelConverter.create();
        var worksheet = workbook.addWorkSheet(this.fileName);

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

        return workbook;
    }

    private columns: { name: string, expression: (x: T) => any, createCell?: (x: any) => ICell }[];
}