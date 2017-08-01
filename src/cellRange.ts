interface ICellRange {
    addAddress(address: ICellAddress);
}

class CellRange implements ICellRange {
    constructor() {
        this.s = new CellAddress(0, 0);
        this.e = new CellAddress(0, 0);
    }

    // start
    s: CellAddress;
    // end
    e: CellAddress;

    addAddress(address: ICellAddress) {
        if (address.r < this.s.r)
            this.s.r = address.r;
        if (address.c < this.s.c)
            this.s.c = address.c;

        if (address.r > this.e.r)
            this.e.r = address.r;
        if (address.c > this.e.c)
            this.e.c = address.c;
    }
}