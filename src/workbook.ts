interface IWorkBook {
    addWorkSheet(name: string): IWorkSheet;
}

class WorkBook implements IWorkBook {
    constructor(private xlsx: any) {
        this['SheetNames'] = [];
        this['Sheets'] = {};
    }

    addWorkSheet(name: string): IWorkSheet {
        var worksheet = new WorkSheet(name, this.xlsx);
        let sheetNames: string[] = this['SheetNames'];
        sheetNames.push(name);
        this['Sheets'][name] = worksheet;
        return worksheet;
    }

    private _sheetNames: string[];
    private _sheets: string[][];
}