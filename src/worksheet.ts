interface IWorkSheet {
    name: string;
    setCell(row: number, col: number, value: any, cell?: ICell);
    getCell(row: number, col: number): ICell;
}

class WorkSheet implements IWorkSheet {
    constructor(public name) {
        this._range = new CellRange();
    }

    private _range: ICellRange;

    setCell(row: number, col: number, value: any, cell?: ICell) {
        var address = new CellAddress(row, col);
        if (!cell)
            cell = new StringCell(value);

        var cellReference = ExcelUtils.encodeCell(address);
        this[cellReference] = cell;

        this._range.addAddress(address);
        this["!ref"] = ExcelUtils.encodeRange(this._range);
    }

    getCell(row: number, col: number): ICell {
        var address = new CellAddress(row, col);
        var cellReference = ExcelUtils.encodeCell(address);
        var cell = this[cellReference];
        return cell;
    }
}