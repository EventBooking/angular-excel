interface ICell {
    v: any;
    t: string;
}

class DateCell implements ICell {
    constructor(value?: any) {
        if (value == null)
            return;

        this.v = value;
        this.t = 'd';
    }

    // raw value (data types)
    v: any;
    // cell type
    t: string; // DataTypes
}

class StringCell implements ICell {
    constructor(value?: any) {
        if (value == null)
            return;

        this.v = value;
        this.t = 's';
    }

    // raw value (data types)
    v: any;
    // cell type
    t: string; // DataTypes
}