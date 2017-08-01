interface ICellAddress {
    c: number;
    r: number;
}

class CellAddress implements ICellAddress {
    constructor(row: number, col: number) {
        this.r = row;
        this.c = col;
    }

    // 0-indexed column
    c: number;
    // 0-indexed row
    r: number;
}