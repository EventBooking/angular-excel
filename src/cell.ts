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
    constructor(value: string, format: string = "$#,##0.00") {
        super();
        this.setValue(value, 'n', format);
    }
}

class TimeCell extends Cell {
    private static SECONDS_IN_DAY = 86400;
    private static SECONDS_IN_HOUR = 3600;
    private static SECONDS_IN_MINUTE = 60;

    constructor(isoTime: string, format: string = "h:mm AM/PM") {
        super();
        const value = TimeCell.formatValue(isoTime);
        this.setValue(value, 'n', format);
    }

    private static formatValue(isoTime: string) {
        if (isoTime == null)
            return;

        const values = isoTime.split(":");
        const hourSeconds = Number(values[0]) * TimeCell.SECONDS_IN_HOUR;
        const minuteSeconds = Number(values[1]) * TimeCell.SECONDS_IN_MINUTE;
        const seconds = Number(values[2]);
        const totalSeconds = hourSeconds + minuteSeconds + seconds;
        const value = totalSeconds / TimeCell.SECONDS_IN_DAY;
        return value;
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