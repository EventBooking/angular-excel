class ExcelUtils {
    private static saveAs: any;
    private static xlsx: any;
    private static currency: any;
    private static accounting: any;

    static bootstrap(saveAs: any, xlsx, currency: any, accounting: any) {
        ExcelUtils.saveAs = saveAs;
        ExcelUtils.xlsx = xlsx;
        ExcelUtils.currency = currency;
        ExcelUtils.accounting = accounting;
    }

    public static encodeCell(address: ICellAddress) {
        return ExcelUtils.xlsx.utils.encode_cell(address);
    }

    public static encodeRange(range: ICellRange) {
        return ExcelUtils.xlsx.utils.encode_range(range);
    }

    public static getCurrencyFormat(currency: string): string {
        const currencySymbol = ExcelUtils.currency.symbolize(currency);
        const currencySettings = ExcelUtils.accounting.settings.currency;
        var currencyFormat = `${currencySymbol}#${currencySettings.thousand}##0${currencySettings.decimal}00`;
        return currencyFormat;
    }

    public static formatTime(isoTime: string): number {
        if (isoTime == null)
            return;

        const SECONDS_IN_DAY = 86400;
        const SECONDS_IN_HOUR = 3600;
        const SECONDS_IN_MINUTE = 60;

        const values = isoTime.split(":");
        const hourSeconds = Number(values[0]) * SECONDS_IN_HOUR;
        const minuteSeconds = Number(values[1]) * SECONDS_IN_MINUTE;
        const seconds = Number(values[2]);
        const totalSeconds = hourSeconds + minuteSeconds + seconds;
        const value = totalSeconds / SECONDS_IN_DAY;
        return value;
    }

    public static convertToBinary(workbook: string): ArrayBuffer {
        var buffer = new ArrayBuffer(workbook.length);
        var view = new Uint8Array(buffer);
        for (var i = 0; i !== workbook.length; ++i)
            view[i] = workbook.charCodeAt(i) & 0xFF;
        return buffer;
    }

    public static writeWorkbook(workbook: IWorkBook, options?: any, enableLegacySafariSupport = true): string {
        options = options || {
            bookType: 'xlsx', 
            type: 'binary'
        };
        options.bookSST = enableLegacySafariSupport;
        return this.xlsx.write(workbook, options);
    }

    public static saveBuffer(name: string, buffer: ArrayBuffer) {
        ExcelUtils.saveAs(new Blob([buffer], { type: "application/octet-stream" }), `${name}.xlsx`);
    }
}