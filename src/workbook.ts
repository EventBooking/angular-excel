interface IWorkBook {
    addWorkSheet(ws: string | WorkSheet): IWorkSheet;

}

class WorkBook implements IWorkBook {
    constructor(private xlsx: any) {
        this['SheetNames'] = [];
        this['Sheets'] = {};
    }

    addWorkSheet(worksheet: string | WorkSheet): IWorkSheet {
        if (typeof worksheet == "string")
            worksheet = new WorkSheet(worksheet, this.xlsx);

        const name = worksheet.name;
        let sheetNames: string[] = this['SheetNames'];
        sheetNames.push(name);
        this['Sheets'][name] = worksheet;
        
        return worksheet;
    }

    private _sheetNames: string[];
    private _sheets: string[][];
}