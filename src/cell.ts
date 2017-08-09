// see: https://github.com/SheetJS/js-xlsx#cell-object

interface ICell {
    v: any;
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
    v: any;
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

class DateCell implements ICell {
    constructor(value?: any, formattedText?: string) {
        if (value == null)
            return;

        this.v = value;
        this.t = 'd';
        this.w = formattedText;
    }

    v: any;
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

class StringCell implements ICell {
    constructor(value?: any, formattedText?: string) {
        if (value == null)
            return;

        this.v = value;
        this.t = 's';
        this.w = formattedText;
    }

    v: any;
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