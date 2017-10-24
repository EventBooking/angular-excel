interface IWorkBook {
    addWorkSheet(ws: string | IWorkSheet): IWorkSheet;
    save();
    saveAs(name: string);
}

class WorkBook implements IWorkBook {
    constructor(public name: string = "Workbook") {
        this['SheetNames'] = [];
        this['Sheets'] = {};
    }

    addWorkSheet(worksheet: string | IWorkSheet): IWorkSheet {
        if (typeof worksheet == "string")
            worksheet = new WorkSheet(worksheet);

        const name = worksheet.name;
        let sheetNames: string[] = this['SheetNames'];
        sheetNames.push(name);
        this['Sheets'][name] = worksheet;
        
        return worksheet;
    }

    save() {
        this.saveAs(this.name);
    }

    saveAs(name: string) {
        const wbout = ExcelUtils.writeWorkbook(this);
        var buffer = ExcelUtils.convertToBinary(wbout);
        ExcelUtils.saveBuffer(name, buffer);
    }

    private _sheetNames: string[];
    private _sheets: string[][];
}