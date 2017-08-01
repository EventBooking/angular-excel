interface IWorkSheet {
    name: string;
    setCell(row: number, col: number, value: any, cell?: ICell);
    getCell(row: number, col: number): ICell;
}

class WorkSheet implements IWorkSheet {
    constructor(public name, private xlsx: any) {
        this._range = new CellRange();
    }

    private _range: ICellRange;

    setCell(row: number, col: number, value: any, cell?: ICell) {
        var address = new CellAddress(row, col);
        if (!cell)
            cell = new StringCell(value);

        var cellReference = this.xlsx.utils.encode_cell(address);
        this[cellReference] = cell;

        this._range.addAddress(address);
        this["!ref"] = this.xlsx.utils.encode_range(this._range);
    }

    getCell(row: number, col: number): ICell {
        var address = new CellAddress(row, col);
        var cellReference = this.xlsx.utils.encode_cell(address);
        var cell = this[cellReference];
        return cell;
    }
}