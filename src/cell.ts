// see: https://github.com/SheetJS/js-xlsx#cell-object

interface ICell {
    v: string;
    w: string;
    t: string;
    f: string;
    F: string;
    r: string;
    h: string;
    c: string;
    z: string;
    l: string;
    s: string;
}

class Cell implements ICell {
    protected setValue(value: any, type: string, format?: string) {
        if (value == null)
            return;
        this.v = value.toString();
        this.t = type;
        this.z = format;
    }

    protected setFormat(format?: string) {
        this.z = format;
    }

    v: string;
    w: string;
    t: string;
    f: string;
    F: string;
    r: string;
    h: string;
    c: string;
    z: string;
    l: string;
    s: string;
}

class DateCell extends Cell {
    constructor(isoDate: string) {
        super();
        this.setValue(isoDate, 'd');
    }
}

class CurrencyCell extends Cell {
    constructor(value: number, format: string = "$#,##0.00") {
        super();
        this.setValue(value, 'n', format);
    }

    setFormat(format: string) {
        super.setFormat(format);
    }
}

class TimeCell extends Cell {
    constructor(isoTime: string, format: string = "h:mm AM/PM") {
        super();
        const value = ExcelUtils.formatTime(isoTime);
        this.setValue(value, 'n', format);
    }
}

class NumberCell extends Cell {
    constructor(value?: any) {
        super();
        this.setValue(value, 'n');
    }
}

class StringCell extends Cell {
    constructor(value?: any) {
        super();
        this.setValue(value, 's');
    }
}