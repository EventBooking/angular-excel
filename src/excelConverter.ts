interface IExcelConverter {
    create(): IWorkBook;
    createBuilder<T>(values: T[]): WorkSheetBuilder<T>;
    saveAs(name: string, workbook: IWorkBook);
}

class ExcelConverter implements IExcelConverter {

    static $inject = ['saveAs', 'XLSX', 'moment', 'currency', 'accounting'];

    constructor(private _saveAs: any, private xlsx: any, private moment: any, private currency: any, private accounting: any) {

    }

    create(): IWorkBook {
        var wb = new WorkBook(this.xlsx);
        return wb;
    }

    createBuilder<T>(values: T[]): WorkSheetBuilder<T> {
        const builder = new WorkSheetBuilder(this.xlsx, this.moment, this.currency, this.accounting, values);
        return builder;
    }

    saveAs(name: string, workbook: IWorkBook) {
        var wbout = this.xlsx.write(workbook, { bookType: 'xlsx', bookSST: false, type: 'binary' });
        var buffer = this.convertToBinary(wbout);
        this._saveAs(new Blob([buffer], { type: "application/octet-stream" }), `${name}.xlsx`);
    }

    private convertToBinary(workbook) {
        var buffer = new ArrayBuffer(workbook.length);
        var view = new Uint8Array(buffer);
        for (var i = 0; i !== workbook.length; ++i)
            view[i] = workbook.charCodeAt(i) & 0xFF;
        return buffer;
    }
}

Angular.module("angular-excel").service('excelConverter', ExcelConverter);