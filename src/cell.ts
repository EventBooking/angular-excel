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
    constructor(value: any) {
        if (value == null)
            return;

        this.v = value;
        this.t = 'd';
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

class CurrencyCell implements ICell {
    constructor(value: string, format: string) {
        if (value == null)
            return;

        this.v = value;
        this.t = 'n';
        this.z = format;
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

class TimeCell implements ICell {
    private static SECONDS_IN_DAY = 86400;
    private static SECONDS_IN_HOUR = 3600;
    private static SECONDS_IN_MINUTE = 60;

    constructor(isoTime: string, format: string = "h:mm AM/PM") {
        if (isoTime == null)
            return;

        const values = isoTime.split(":");
        const hourSeconds = Number(values[0]) * TimeCell.SECONDS_IN_HOUR;
        const minuteSeconds = Number(values[1]) * TimeCell.SECONDS_IN_MINUTE;
        const seconds = Number(values[2]);
        const totalSeconds = hourSeconds + minuteSeconds + seconds;
        const value = totalSeconds / TimeCell.SECONDS_IN_DAY;

        this.v = value;
        this.t = 'n';
        this.z = format;
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

class NumberCell implements ICell {
    constructor(value?: any) {
        if (value == null)
            return;

        this.v = value;
        this.t = 'n';
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
    constructor(value?: any) {
        if (value == null)
            return;

        this.v = value;
        this.t = 's';
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