interface IExcelConverter {
    create(): IWorkBook;
    createBuilder<T>(values: T[]): IWorkSheetBuilder<T>;
    createComplexBuilder(): IExcelBuilder;
    saveAs(name: string, workbook: IWorkBook);
}

class ExcelConverter implements IExcelConverter {

    create(): IWorkBook {
        return new WorkBook(null);
    }

    createBuilder<T>(values: T[]): IWorkSheetBuilder<T> {
        return new WorkSheetBuilder(values);
    }

    createComplexBuilder(): IExcelBuilder {
        return new ExcelBuilder();
    }

    saveAs(name: string, workbook: IWorkBook) {
        workbook.saveAs(name);
    }
}

Angular.module("angular-excel").service('excelConverter', ExcelConverter);