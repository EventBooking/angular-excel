var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var excel;
(function (excel) {
    var ExcelRun = (function () {
        function ExcelRun(saveAs, xlsx, currency, accounting) {
            ExcelUtils.bootstrap(saveAs, xlsx, currency, accounting);
        }
        ExcelRun.$inject = ["saveAs", "XLSX", "currency", "accounting"];
        return ExcelRun;
    }());
    Angular.module("angular-excel", [])
        .constant("saveAs", saveAs)
        .constant("XLSX", XLSX)
        .constant("moment", moment)
        .constant("currency", currency)
        .constant("accounting", accounting)
        .run(ExcelRun);
})(excel || (excel = {}));
var ExcelUtils = (function () {
    function ExcelUtils() {
    }
    ExcelUtils.bootstrap = function (saveAs, xlsx, currency, accounting) {
        ExcelUtils.saveAs = saveAs;
        ExcelUtils.xlsx = xlsx;
        ExcelUtils.currency = currency;
        ExcelUtils.accounting = accounting;
    };
    ExcelUtils.encodeCell = function (address) {
        return ExcelUtils.xlsx.utils.encode_cell(address);
    };
    ExcelUtils.encodeRange = function (range) {
        return ExcelUtils.xlsx.utils.encode_range(range);
    };
    ExcelUtils.getCurrencyFormat = function (currency) {
        var currencySymbol = ExcelUtils.currency.symbolize(currency);
        var currencySettings = ExcelUtils.accounting.settings.currency;
        var currencyFormat = currencySymbol + "#" + currencySettings.thousand + "##0" + currencySettings.decimal + "00";
        return currencyFormat;
    };
    ExcelUtils.formatTime = function (isoTime) {
        if (isoTime == null)
            return;
        var SECONDS_IN_DAY = 86400;
        var SECONDS_IN_HOUR = 3600;
        var SECONDS_IN_MINUTE = 60;
        var values = isoTime.split(":");
        var hourSeconds = Number(values[0]) * SECONDS_IN_HOUR;
        var minuteSeconds = Number(values[1]) * SECONDS_IN_MINUTE;
        var seconds = Number(values[2]);
        var totalSeconds = hourSeconds + minuteSeconds + seconds;
        var value = totalSeconds / SECONDS_IN_DAY;
        return value;
    };
    ExcelUtils.convertToBinary = function (workbook) {
        var buffer = new ArrayBuffer(workbook.length);
        var view = new Uint8Array(buffer);
        for (var i = 0; i !== workbook.length; ++i)
            view[i] = workbook.charCodeAt(i) & 0xFF;
        return buffer;
    };
    ExcelUtils.writeWorkbook = function (workbook, options, enableLegacySafariSupport) {
        if (enableLegacySafariSupport === void 0) { enableLegacySafariSupport = true; }
        options = options || {
            bookType: 'xlsx',
            type: 'binary'
        };
        options.bookSST = enableLegacySafariSupport;
        return this.xlsx.write(workbook, options);
    };
    ExcelUtils.saveBuffer = function (name, buffer) {
        ExcelUtils.saveAs(new Blob([buffer], { type: "application/octet-stream" }), name + ".xlsx");
    };
    return ExcelUtils;
}());
var CellAddress = (function () {
    function CellAddress(row, col) {
        this.r = row;
        this.c = col;
    }
    return CellAddress;
}());
var CellRange = (function () {
    function CellRange() {
        this.s = new CellAddress(0, 0);
        this.e = new CellAddress(0, 0);
    }
    CellRange.prototype.addAddress = function (address) {
        if (address.r < this.s.r)
            this.s.r = address.r;
        if (address.c < this.s.c)
            this.s.c = address.c;
        if (address.r > this.e.r)
            this.e.r = address.r;
        if (address.c > this.e.c)
            this.e.c = address.c;
    };
    return CellRange;
}());
// see: https://github.com/SheetJS/js-xlsx#cell-object
var Cell = (function () {
    function Cell() {
    }
    Cell.prototype.setValue = function (value, type, format) {
        if (value == null)
            return;
        this.v = value.toString();
        this.t = type;
        this.z = format;
    };
    Cell.prototype.setFormat = function (format) {
        this.z = format;
    };
    return Cell;
}());
var DateCell = (function (_super) {
    __extends(DateCell, _super);
    function DateCell(isoDate) {
        var _this = _super.call(this) || this;
        _this.setValue(isoDate, 'd');
        return _this;
    }
    return DateCell;
}(Cell));
var CurrencyCell = (function (_super) {
    __extends(CurrencyCell, _super);
    function CurrencyCell(value, format) {
        if (format === void 0) { format = "$#,##0.00"; }
        var _this = _super.call(this) || this;
        _this.setValue(value, 'n', format);
        return _this;
    }
    CurrencyCell.prototype.setFormat = function (format) {
        _super.prototype.setFormat.call(this, format);
    };
    return CurrencyCell;
}(Cell));
var TimeCell = (function (_super) {
    __extends(TimeCell, _super);
    function TimeCell(isoTime, format) {
        if (format === void 0) { format = "h:mm AM/PM"; }
        var _this = _super.call(this) || this;
        var value = ExcelUtils.formatTime(isoTime);
        _this.setValue(value, 'n', format);
        return _this;
    }
    return TimeCell;
}(Cell));
var NumberCell = (function (_super) {
    __extends(NumberCell, _super);
    function NumberCell(value) {
        var _this = _super.call(this) || this;
        _this.setValue(value, 'n');
        return _this;
    }
    return NumberCell;
}(Cell));
var StringCell = (function (_super) {
    __extends(StringCell, _super);
    function StringCell(value) {
        var _this = _super.call(this) || this;
        _this.setValue(value, 's');
        return _this;
    }
    return StringCell;
}(Cell));
var WorkSheet = (function () {
    function WorkSheet(name) {
        if (name === void 0) { name = "worksheet"; }
        this.name = name;
        name = name.slice(0, 31);
        this._range = new CellRange();
    }
    WorkSheet.prototype.setCell = function (row, col, value, cell) {
        var address = new CellAddress(row, col);
        if (!cell)
            cell = new StringCell(value);
        var cellReference = ExcelUtils.encodeCell(address);
        this[cellReference] = cell;
        this._range.addAddress(address);
        this["!ref"] = ExcelUtils.encodeRange(this._range);
    };
    WorkSheet.prototype.getCell = function (row, col) {
        var address = new CellAddress(row, col);
        var cellReference = ExcelUtils.encodeCell(address);
        var cell = this[cellReference];
        return cell;
    };
    return WorkSheet;
}());
var WorkBook = (function () {
    function WorkBook(name) {
        if (name === void 0) { name = "Workbook"; }
        this.name = name;
        this['SheetNames'] = [];
        this['Sheets'] = {};
    }
    WorkBook.prototype.addWorkSheet = function (worksheet) {
        if (typeof worksheet == "string")
            worksheet = new WorkSheet(worksheet);
        var name = worksheet.name;
        var sheetNames = this['SheetNames'];
        sheetNames.push(name);
        this['Sheets'][name] = worksheet;
        return worksheet;
    };
    WorkBook.prototype.save = function () {
        this.saveAs(this.name);
    };
    WorkBook.prototype.saveAs = function (name) {
        var wbout = ExcelUtils.writeWorkbook(this);
        var buffer = ExcelUtils.convertToBinary(wbout);
        ExcelUtils.saveBuffer(name, buffer);
    };
    return WorkBook;
}());
var ExcelBuilder = (function () {
    function ExcelBuilder() {
        this.rows = [];
    }
    ExcelBuilder.prototype.setCurrency = function (currency) {
        this.currencyFormat = ExcelUtils.getCurrencyFormat(currency);
        return this;
    };
    ExcelBuilder.prototype.setName = function (name) {
        this.name = name;
        return this;
    };
    ExcelBuilder.prototype.addRow = function (row) {
        this.rows.push(row);
        return this;
    };
    ExcelBuilder.prototype.addRows = function (rows) {
        var _this = this;
        rows.forEach(function (x) { return _this.addRow(x); });
        return this;
    };
    ExcelBuilder.prototype.build = function () {
        var _this = this;
        var worksheet = new WorkSheet(this.name);
        this.rows.forEach(function (row, rowIdx) {
            row.cells.forEach(function (cell, cellIdx) {
                if (cell instanceof CurrencyCell)
                    cell.setFormat(_this.currencyFormat);
                worksheet.setCell(rowIdx, cellIdx, null, cell);
            });
        });
        return worksheet;
    };
    return ExcelBuilder;
}());
var ExcelRow = (function () {
    function ExcelRow() {
        this.cells = [];
    }
    ExcelRow.prototype.addEmpty = function (count) {
        if (count === void 0) { count = 1; }
        for (var i = 0; i < count; i++)
            this.addString();
        return this;
    };
    ExcelRow.prototype.addString = function (value) {
        return this.addCell(new StringCell(value));
    };
    ExcelRow.prototype.addStrings = function (values) {
        var _this = this;
        values.forEach(function (x) { return _this.addString(x); });
        return this;
    };
    ExcelRow.prototype.addNumber = function (value) {
        return this.addCell(new NumberCell(value));
    };
    ExcelRow.prototype.addNumbers = function (values) {
        var _this = this;
        values.forEach(function (x) { return _this.addNumber(x); });
        return this;
    };
    ExcelRow.prototype.addCurrency = function (value, format) {
        return this.addCell(new CurrencyCell(value, format));
    };
    ExcelRow.prototype.addCurrencies = function (values) {
        var _this = this;
        values.forEach(function (x) { return _this.addCurrency(x); });
        return this;
    };
    ExcelRow.prototype.addDate = function (isoDate) {
        return this.addCell(new DateCell(isoDate));
    };
    ExcelRow.prototype.addDates = function (isoDates) {
        var _this = this;
        isoDates.forEach(function (x) { return _this.addDate(x); });
        return this;
    };
    ExcelRow.prototype.addTime = function (isoTime, format) {
        return this.addCell(new TimeCell(isoTime, format));
    };
    ExcelRow.prototype.addTimes = function (isoTimes) {
        var _this = this;
        isoTimes.forEach(function (x) { return _this.addTime(x); });
        return this;
    };
    ExcelRow.prototype.addCell = function (cell) {
        this.cells.push(cell);
        return this;
    };
    ExcelRow.prototype.addCells = function (cells) {
        var _this = this;
        cells.forEach(function (x) { return _this.addCell(x); });
        return this;
    };
    return ExcelRow;
}());
var WorkSheetBuilder = (function () {
    function WorkSheetBuilder(values) {
        this.values = values;
        this.columns = [];
    }
    WorkSheetBuilder.prototype.addTimeColumn = function (name, expression, format) {
        this.columns.push({ name: name, expression: expression, createCell: function (x) { return new TimeCell(x, format); } });
        return this;
    };
    WorkSheetBuilder.prototype.addDateColumn = function (name, expression) {
        this.columns.push({
            name: name,
            expression: expression,
            createCell: function (x) { return new DateCell(x); }
        });
        return this;
    };
    WorkSheetBuilder.prototype.addNumberColumn = function (name, expression) {
        this.columns.push({ name: name, expression: expression, createCell: function (x) { return new NumberCell(x); } });
        return this;
    };
    WorkSheetBuilder.prototype.addCurrencyColumn = function (name, expression, getCurrency) {
        var _this = this;
        this.columns.push({
            name: name, expression: expression, createCell: function (value, x) {
                var format = getCurrency ? ExcelUtils.getCurrencyFormat(getCurrency(x)) : _this.currencyFormat;
                return new CurrencyCell(value, format);
            }
        });
        return this;
    };
    WorkSheetBuilder.prototype.addColumn = function (name, expression, createCell) {
        this.columns.push({ name: name, expression: expression, createCell: createCell });
        return this;
    };
    WorkSheetBuilder.prototype.setCurrency = function (currency) {
        this.currencyFormat = ExcelUtils.getCurrencyFormat(currency);
        return this;
    };
    WorkSheetBuilder.prototype.setName = function (name) {
        this.name = name;
        return this;
    };
    WorkSheetBuilder.prototype.build = function () {
        var _this = this;
        var worksheet = new WorkSheet(this.name);
        for (var colIdx = 0; colIdx < this.columns.length; colIdx++) {
            var column = this.columns[colIdx];
            worksheet.setCell(0, colIdx, column.name);
        }
        this.values.forEach(function (x, rowIdx) {
            for (var colIdx = 0; colIdx < _this.columns.length; colIdx++) {
                var column = _this.columns[colIdx];
                var value = column.expression(x);
                var cell = column.createCell ? column.createCell(value, x) : null;
                worksheet.setCell(rowIdx + 1, colIdx, value, cell);
            }
        });
        return worksheet;
    };
    return WorkSheetBuilder;
}());
var ExcelConverter = (function () {
    function ExcelConverter() {
    }
    ExcelConverter.prototype.create = function () {
        return new WorkBook(null);
    };
    ExcelConverter.prototype.createBuilder = function (values) {
        return new WorkSheetBuilder(values);
    };
    ExcelConverter.prototype.createComplexBuilder = function () {
        return new ExcelBuilder();
    };
    ExcelConverter.prototype.saveAs = function (name, workbook) {
        workbook.saveAs(name);
    };
    return ExcelConverter;
}());
Angular.module("angular-excel").service('excelConverter', ExcelConverter);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ndWxhci1leGNlbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9hcHAudHMiLCIuLi9zcmMvdXRpbHMudHMiLCIuLi9zcmMvY2VsbEFkZHJlc3MudHMiLCIuLi9zcmMvY2VsbFJhbmdlLnRzIiwiLi4vc3JjL2NlbGwudHMiLCIuLi9zcmMvd29ya3NoZWV0LnRzIiwiLi4vc3JjL3dvcmtib29rLnRzIiwiLi4vc3JjL2V4Y2VsQnVpbGRlci50cyIsIi4uL3NyYy93b3Jrc2hlZXRCdWlsZGVyLnRzIiwiLi4vc3JjL2V4Y2VsQ29udmVydGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxJQUFVLEtBQUssQ0FzQmQ7QUF0QkQsV0FBVSxLQUFLO0lBT1g7UUFHSSxrQkFBWSxNQUFXLEVBQUUsSUFBUyxFQUFFLFFBQWEsRUFBRSxVQUFlO1lBQzlELFVBQVUsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDN0QsQ0FBQztRQUpNLGdCQUFPLEdBQUcsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUtsRSxlQUFDO0tBQUEsQUFORCxJQU1DO0lBRUQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsRUFBRSxDQUFDO1NBQzlCLFFBQVEsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDO1NBQzFCLFFBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDO1NBQ3RCLFFBQVEsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDO1NBQzFCLFFBQVEsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDO1NBQzlCLFFBQVEsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDO1NBQ2xDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN2QixDQUFDLEVBdEJTLEtBQUssS0FBTCxLQUFLLFFBc0JkO0FDdEJEO0lBQUE7SUFpRUEsQ0FBQztJ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R0FBTjtRQUNJLE1BQU0sQ0FBQyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBRUQsc0NBQWEsR0FBYixVQUFpQixNQUFXO1FBQ3hCLE1BQU0sQ0FBQyxJQUFJLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCw2Q0FBb0IsR0FBcEI7UUFDSSxNQUFNLENBQUMsSUFBSSxZQUFZLEVBQUUsQ0FBQztJQUM5QixDQUFDO0lBRUQsK0JBQU0sR0FBTixVQUFPLElBQVksRUFBRSxRQUFtQjtRQUNwQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFDTCxxQkFBQztBQUFELENBQUMsQUFqQkQsSUFpQkM7QUFFRCxPQUFPLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxjQUFjLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIm5hbWVzcGFjZSBleGNlbCB7XHJcbiAgICBkZWNsYXJlIHZhciBYTFNYOiBhbnk7XHJcbiAgICBkZWNsYXJlIHZhciBzYXZlQXM6IGFueTtcclxuICAgIGRlY2xhcmUgdmFyIG1vbWVudDogYW55O1xyXG4gICAgZGVjbGFyZSB2YXIgY3VycmVuY3k6IGFueTtcclxuICAgIGRlY2xhcmUgdmFyIGFjY291bnRpbmc6IGFueTtcclxuXHJcbiAgICBjbGFzcyBFeGNlbFJ1biB7XHJcbiAgICAgICAgc3RhdGljICRpbmplY3QgPSBbXCJzYXZlQXNcIiwgXCJYTFNYXCIsIFwiY3VycmVuY3lcIiwgXCJhY2NvdW50aW5nXCJdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihzYXZlQXM6IGFueSwgeGxzeDogYW55LCBjdXJyZW5jeTogYW55LCBhY2NvdW50aW5nOiBhbnkpIHtcclxuICAgICAgICAgICAgRXhjZWxVdGlscy5ib290c3RyYXAoc2F2ZUFzLCB4bHN4LCBjdXJyZW5jeSwgYWNjb3VudGluZyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIEFuZ3VsYXIubW9kdWxlKFwiYW5ndWxhci1leGNlbFwiLCBbXSlcclxuICAgICAgICAuY29uc3RhbnQoXCJzYXZlQXNcIiwgc2F2ZUFzKVxyXG4gICAgICAgIC5jb25zdGFudChcIlhMU1hcIiwgWExTWClcclxuICAgICAgICAuY29uc3RhbnQoXCJtb21lbnRcIiwgbW9tZW50KVxyXG4gICAgICAgIC5jb25zdGFudChcImN1cnJlbmN5XCIsIGN1cnJlbmN5KVxyXG4gICAgICAgIC5jb25zdGFudChcImFjY291bnRpbmdcIiwgYWNjb3VudGluZylcclxuICAgICAgICAucnVuKEV4Y2VsUnVuKTtcclxufSIsImNsYXNzIEV4Y2VsVXRpbHMge1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgc2F2ZUFzOiBhbnk7XHJcbiAgICBwcml2YXRlIHN0YXRpYyB4bHN4OiBhbnk7XHJcbiAgICBwcml2YXRlIHN0YXRpYyBjdXJyZW5jeTogYW55O1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgYWNjb3VudGluZzogYW55O1xyXG5cclxuICAgIHN0YXRpYyBib290c3RyYXAoc2F2ZUFzOiBhbnksIHhsc3gsIGN1cnJlbmN5OiBhbnksIGFjY291bnRpbmc6IGFueSkge1xyXG4gICAgICAgIEV4Y2VsVXRpbHMuc2F2ZUFzID0gc2F2ZUFzO1xyXG4gICAgICAgIEV4Y2VsVXRpbHMueGxzeCA9IHhsc3g7XHJcbiAgICAgICAgRXhjZWxVdGlscy5jdXJyZW5jeSA9IGN1cnJlbmN5O1xyXG4gICAgICAgIEV4Y2VsVXRpbHMuYWNjb3VudGluZyA9IGFjY291bnRpbmc7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBlbmNvZGVDZWxsKGFkZHJlc3M6IElDZWxsQWRkcmVzcykge1xyXG4gICAgICAgIHJldHVybiBFeGNlbFV0aWxzLnhsc3gudXRpbHMuZW5jb2RlX2NlbGwoYWRkcmVzcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBlbmNvZGVSYW5nZShyYW5nZTogSUNlbGxSYW5nZSkge1xyXG4gICAgICAgIHJldHVybiBFeGNlbFV0aWxzLnhsc3gudXRpbHMuZW5jb2RlX3JhbmdlKHJhbmdlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGdldEN1cnJlbmN5Rm9ybWF0KGN1cnJlbmN5OiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbmN5U3ltYm9sID0gRXhjZWxVdGlscy5jdXJyZW5jeS5zeW1ib2xpemUoY3VycmVuY3kpO1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbmN5U2V0dGluZ3MgPSBFeGNlbFV0aWxzLmFjY291bnRpbmcuc2V0dGluZ3MuY3VycmVuY3k7XHJcbiAgICAgICAgdmFyIGN1cnJlbmN5Rm9ybWF0ID0gYCR7Y3VycmVuY3lTeW1ib2x9IyR7Y3VycmVuY3lTZXR0aW5ncy50aG91c2FuZH0jIzAke2N1cnJlbmN5U2V0dGluZ3MuZGVjaW1hbH0wMGA7XHJcbiAgICAgICAgcmV0dXJuIGN1cnJlbmN5Rm9ybWF0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZm9ybWF0VGltZShpc29UaW1lOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gICAgICAgIGlmIChpc29UaW1lID09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgY29uc3QgU0VDT05EU19JTl9EQVkgPSA4NjQwMDtcclxuICAgICAgICBjb25zdCBTRUNPTkRTX0lOX0hPVVIgPSAzNjAwO1xyXG4gICAgICAgIGNvbnN0IFNFQ09ORFNfSU5fTUlOVVRFID0gNjA7XHJcblxyXG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IGlzb1RpbWUuc3BsaXQoXCI6XCIpO1xyXG4gICAgICAgIGNvbnN0IGhvdXJTZWNvbmRzID0gTnVtYmVyKHZhbHVlc1swXSkgKiBTRUNPTkRTX0lOX0hPVVI7XHJcbiAgICAgICAgY29uc3QgbWludXRlU2Vjb25kcyA9IE51bWJlcih2YWx1ZXNbMV0pICogU0VDT05EU19JTl9NSU5VVEU7XHJcbiAgICAgICAgY29uc3Qgc2Vjb25kcyA9IE51bWJlcih2YWx1ZXNbMl0pO1xyXG4gICAgICAgIGNvbnN0IHRvdGFsU2Vjb25kcyA9IGhvdXJTZWNvbmRzICsgbWludXRlU2Vjb25kcyArIHNlY29uZHM7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSB0b3RhbFNlY29uZHMgLyBTRUNPTkRTX0lOX0RBWTtcclxuICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBjb252ZXJ0VG9CaW5hcnkod29ya2Jvb2s6IHN0cmluZyk6IEFycmF5QnVmZmVyIHtcclxuICAgICAgICB2YXIgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKHdvcmtib29rLmxlbmd0aCk7XHJcbiAgICAgICAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpICE9PSB3b3JrYm9vay5sZW5ndGg7ICsraSlcclxuICAgICAgICAgICAgdmlld1tpXSA9IHdvcmtib29rLmNoYXJDb2RlQXQoaSkgJiAweEZGO1xyXG4gICAgICAgIHJldHVybiBidWZmZXI7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyB3cml0ZVdvcmtib29rKHdvcmtib29rOiBJV29ya0Jvb2ssIG9wdGlvbnM/OiBhbnksIGVuYWJsZUxlZ2FjeVNhZmFyaVN1cHBvcnQgPSB0cnVlKTogc3RyaW5nIHtcclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7XHJcbiAgICAgICAgICAgIGJvb2tUeXBlOiAneGxzeCcsIFxyXG4gICAgICAgICAgICB0eXBlOiAnYmluYXJ5J1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgb3B0aW9ucy5ib29rU1NUID0gZW5hYmxlTGVnYWN5U2FmYXJpU3VwcG9ydDtcclxuICAgICAgICByZXR1cm4gdGhpcy54bHN4LndyaXRlKHdvcmtib29rLCBvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIHNhdmVCdWZmZXIobmFtZTogc3RyaW5nLCBidWZmZXI6IEFycmF5QnVmZmVyKSB7XHJcbiAgICAgICAgRXhjZWxVdGlscy5zYXZlQXMobmV3IEJsb2IoW2J1ZmZlcl0sIHsgdHlwZTogXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIiB9KSwgYCR7bmFtZX0ueGxzeGApO1xyXG4gICAgfVxyXG59IiwiaW50ZXJmYWNlIElDZWxsQWRkcmVzcyB7XHJcbiAgICBjOiBudW1iZXI7XHJcbiAgICByOiBudW1iZXI7XHJcbn1cclxuXHJcbmNsYXNzIENlbGxBZGRyZXNzIGltcGxlbWVudHMgSUNlbGxBZGRyZXNzIHtcclxuICAgIGNvbnN0cnVjdG9yKHJvdzogbnVtYmVyLCBjb2w6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuciA9IHJvdztcclxuICAgICAgICB0aGlzLmMgPSBjb2w7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gMC1pbmRleGVkIGNvbHVtblxyXG4gICAgYzogbnVtYmVyO1xyXG4gICAgLy8gMC1pbmRleGVkIHJvd1xyXG4gICAgcjogbnVtYmVyO1xyXG59IiwiaW50ZXJmYWNlIElDZWxsUmFuZ2Uge1xyXG4gICAgYWRkQWRkcmVzcyhhZGRyZXNzOiBJQ2VsbEFkZHJlc3MpO1xyXG59XHJcblxyXG5jbGFzcyBDZWxsUmFuZ2UgaW1wbGVtZW50cyBJQ2VsbFJhbmdlIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMucyA9IG5ldyBDZWxsQWRkcmVzcygwLCAwKTtcclxuICAgICAgICB0aGlzLmUgPSBuZXcgQ2VsbEFkZHJlc3MoMCwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc3RhcnRcclxuICAgIHM6IENlbGxBZGRyZXNzO1xyXG4gICAgLy8gZW5kXHJcbiAgICBlOiBDZWxsQWRkcmVzcztcclxuXHJcbiAgICBhZGRBZGRyZXNzKGFkZHJlc3M6IElDZWxsQWRkcmVzcykge1xyXG4gICAgICAgIGlmIChhZGRyZXNzLnIgPCB0aGlzLnMucilcclxuICAgICAgICAgICAgdGhpcy5zLnIgPSBhZGRyZXNzLnI7XHJcbiAgICAgICAgaWYgKGFkZHJlc3MuYyA8IHRoaXMucy5jKVxyXG4gICAgICAgICAgICB0aGlzLnMuYyA9IGFkZHJlc3MuYztcclxuXHJcbiAgICAgICAgaWYgKGFkZHJlc3MuciA+IHRoaXMuZS5yKVxyXG4gICAgICAgICAgICB0aGlzLmUuciA9IGFkZHJlc3MucjtcclxuICAgICAgICBpZiAoYWRkcmVzcy5jID4gdGhpcy5lLmMpXHJcbiAgICAgICAgICAgIHRoaXMuZS5jID0gYWRkcmVzcy5jO1xyXG4gICAgfVxyXG59IiwiLy8gc2VlOiBodHRwczovL2dpdGh1Yi5jb20vU2hlZXRKUy9qcy14bHN4I2NlbGwtb2JqZWN0XHJcblxyXG5pbnRlcmZhY2UgSUNlbGwge1xyXG4gICAgdjogc3RyaW5nO1xyXG4gICAgdzogc3RyaW5nO1xyXG4gICAgdDogc3RyaW5nO1xyXG4gICAgZjogc3RyaW5nO1xyXG4gICAgRjogc3RyaW5nO1xyXG4gICAgcjogc3RyaW5nO1xyXG4gICAgaDogc3RyaW5nO1xyXG4gICAgYzogc3RyaW5nO1xyXG4gICAgejogc3RyaW5nO1xyXG4gICAgbDogc3RyaW5nO1xyXG4gICAgczogc3RyaW5nO1xyXG59XHJcblxyXG5jbGFzcyBDZWxsIGltcGxlbWVudHMgSUNlbGwge1xyXG4gICAgcHJvdGVjdGVkIHNldFZhbHVlKHZhbHVlOiBhbnksIHR5cGU6IHN0cmluZywgZm9ybWF0Pzogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKHZhbHVlID09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB0aGlzLnYgPSB2YWx1ZS50b1N0cmluZygpO1xyXG4gICAgICAgIHRoaXMudCA9IHR5cGU7XHJcbiAgICAgICAgdGhpcy56ID0gZm9ybWF0O1xyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCBzZXRGb3JtYXQoZm9ybWF0Pzogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy56ID0gZm9ybWF0O1xyXG4gICAgfVxyXG5cclxuICAgIHY6IHN0cmluZztcclxuICAgIHc6IHN0cmluZztcclxuICAgIHQ6IHN0cmluZztcclxuICAgIGY6IHN0cmluZztcclxuICAgIEY6IHN0cmluZztcclxuICAgIHI6IHN0cmluZztcclxuICAgIGg6IHN0cmluZztcclxuICAgIGM6IHN0cmluZztcclxuICAgIHo6IHN0cmluZztcclxuICAgIGw6IHN0cmluZztcclxuICAgIHM6IHN0cmluZztcclxufVxyXG5cclxuY2xhc3MgRGF0ZUNlbGwgZXh0ZW5kcyBDZWxsIHtcclxuICAgIGNvbnN0cnVjdG9yKGlzb0RhdGU6IHN0cmluZykge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5zZXRWYWx1ZShpc29EYXRlLCAnZCcpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBDdXJyZW5jeUNlbGwgZXh0ZW5kcyBDZWxsIHtcclxuICAgIGNvbnN0cnVjdG9yKHZhbHVlOiBudW1iZXIsIGZvcm1hdDogc3RyaW5nID0gXCIkIywjIzAuMDBcIikge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5zZXRWYWx1ZSh2YWx1ZSwgJ24nLCBmb3JtYXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldEZvcm1hdChmb3JtYXQ6IHN0cmluZykge1xyXG4gICAgICAgIHN1cGVyLnNldEZvcm1hdChmb3JtYXQpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBUaW1lQ2VsbCBleHRlbmRzIENlbGwge1xyXG4gICAgY29uc3RydWN0b3IoaXNvVGltZTogc3RyaW5nLCBmb3JtYXQ6IHN0cmluZyA9IFwiaDptbSBBTS9QTVwiKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICBjb25zdCB2YWx1ZSA9IEV4Y2VsVXRpbHMuZm9ybWF0VGltZShpc29UaW1lKTtcclxuICAgICAgICB0aGlzLnNldFZhbHVlKHZhbHVlLCAnbicsIGZvcm1hdCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIE51bWJlckNlbGwgZXh0ZW5kcyBDZWxsIHtcclxuICAgIGNvbnN0cnVjdG9yKHZhbHVlPzogYW55KSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLnNldFZhbHVlKHZhbHVlLCAnbicpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBTdHJpbmdDZWxsIGV4dGVuZHMgQ2VsbCB7XHJcbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZT86IGFueSkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5zZXRWYWx1ZSh2YWx1ZSwgJ3MnKTtcclxuICAgIH1cclxufSIsImludGVyZmFjZSBJV29ya1NoZWV0IHtcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIHNldENlbGwocm93OiBudW1iZXIsIGNvbDogbnVtYmVyLCB2YWx1ZTogYW55LCBjZWxsPzogSUNlbGwpO1xyXG4gICAgZ2V0Q2VsbChyb3c6IG51bWJlciwgY29sOiBudW1iZXIpOiBJQ2VsbDtcclxufVxyXG5cclxuY2xhc3MgV29ya1NoZWV0IGltcGxlbWVudHMgSVdvcmtTaGVldCB7XHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nID0gXCJ3b3Jrc2hlZXRcIikge1xyXG4gICAgICAgIG5hbWUgPSBuYW1lLnNsaWNlKDAsIDMxKTtcclxuICAgICAgICB0aGlzLl9yYW5nZSA9IG5ldyBDZWxsUmFuZ2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9yYW5nZTogSUNlbGxSYW5nZTtcclxuXHJcbiAgICBzZXRDZWxsKHJvdzogbnVtYmVyLCBjb2w6IG51bWJlciwgdmFsdWU6IGFueSwgY2VsbD86IElDZWxsKSB7XHJcbiAgICAgICAgdmFyIGFkZHJlc3MgPSBuZXcgQ2VsbEFkZHJlc3Mocm93LCBjb2wpO1xyXG4gICAgICAgIGlmICghY2VsbClcclxuICAgICAgICAgICAgY2VsbCA9IG5ldyBTdHJpbmdDZWxsKHZhbHVlKTtcclxuXHJcbiAgICAgICAgdmFyIGNlbGxSZWZlcmVuY2UgPSBFeGNlbFV0aWxzLmVuY29kZUNlbGwoYWRkcmVzcyk7XHJcbiAgICAgICAgdGhpc1tjZWxsUmVmZXJlbmNlXSA9IGNlbGw7XHJcblxyXG4gICAgICAgIHRoaXMuX3JhbmdlLmFkZEFkZHJlc3MoYWRkcmVzcyk7XHJcbiAgICAgICAgdGhpc1tcIiFyZWZcIl0gPSBFeGNlbFV0aWxzLmVuY29kZVJhbmdlKHRoaXMuX3JhbmdlKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRDZWxsKHJvdzogbnVtYmVyLCBjb2w6IG51bWJlcik6IElDZWxsIHtcclxuICAgICAgICB2YXIgYWRkcmVzcyA9IG5ldyBDZWxsQWRkcmVzcyhyb3csIGNvbCk7XHJcbiAgICAgICAgdmFyIGNlbGxSZWZlcmVuY2UgPSBFeGNlbFV0aWxzLmVuY29kZUNlbGwoYWRkcmVzcyk7XHJcbiAgICAgICAgdmFyIGNlbGwgPSB0aGlzW2NlbGxSZWZlcmVuY2VdO1xyXG4gICAgICAgIHJldHVybiBjZWxsO1xyXG4gICAgfVxyXG59IiwiaW50ZXJmYWNlIElXb3JrQm9vayB7XHJcbiAgICBhZGRXb3JrU2hlZXQod3M6IHN0cmluZyB8IElXb3JrU2hlZXQpOiBJV29ya1NoZWV0O1xyXG4gICAgc2F2ZSgpO1xyXG4gICAgc2F2ZUFzKG5hbWU6IHN0cmluZyk7XHJcbn1cclxuXHJcbmNsYXNzIFdvcmtCb29rIGltcGxlbWVudHMgSVdvcmtCb29rIHtcclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBuYW1lOiBzdHJpbmcgPSBcIldvcmtib29rXCIpIHtcclxuICAgICAgICB0aGlzWydTaGVldE5hbWVzJ10gPSBbXTtcclxuICAgICAgICB0aGlzWydTaGVldHMnXSA9IHt9O1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFdvcmtTaGVldCh3b3Jrc2hlZXQ6IHN0cmluZyB8IElXb3JrU2hlZXQpOiBJV29ya1NoZWV0IHtcclxuICAgICAgICBpZiAodHlwZW9mIHdvcmtzaGVldCA9PSBcInN0cmluZ1wiKVxyXG4gICAgICAgICAgICB3b3Jrc2hlZXQgPSBuZXcgV29ya1NoZWV0KHdvcmtzaGVldCk7XHJcblxyXG4gICAgICAgIGNvbnN0IG5hbWUgPSB3b3Jrc2hlZXQubmFtZTtcclxuICAgICAgICBsZXQgc2hlZXROYW1lczogc3RyaW5nW10gPSB0aGlzWydTaGVldE5hbWVzJ107XHJcbiAgICAgICAgc2hlZXROYW1lcy5wdXNoKG5hbWUpO1xyXG4gICAgICAgIHRoaXNbJ1NoZWV0cyddW25hbWVdID0gd29ya3NoZWV0O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB3b3Jrc2hlZXQ7XHJcbiAgICB9XHJcblxyXG4gICAgc2F2ZSgpIHtcclxuICAgICAgICB0aGlzLnNhdmVBcyh0aGlzLm5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHNhdmVBcyhuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCB3Ym91dCA9IEV4Y2VsVXRpbHMud3JpdGVXb3JrYm9vayh0aGlzKTtcclxuICAgICAgICB2YXIgYnVmZmVyID0gRXhjZWxVdGlscy5jb252ZXJ0VG9CaW5hcnkod2JvdXQpO1xyXG4gICAgICAgIEV4Y2VsVXRpbHMuc2F2ZUJ1ZmZlcihuYW1lLCBidWZmZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3NoZWV0TmFtZXM6IHN0cmluZ1tdO1xyXG4gICAgcHJpdmF0ZSBfc2hlZXRzOiBzdHJpbmdbXVtdO1xyXG59IiwiaW50ZXJmYWNlIElFeGNlbEJ1aWxkZXIge1xyXG4gICAgc2V0Q3VycmVuY3koY3VycmVuY3k6IHN0cmluZyk6IElFeGNlbEJ1aWxkZXI7XHJcbiAgICBzZXROYW1lKG5hbWU6IHN0cmluZyk6IElFeGNlbEJ1aWxkZXI7XHJcbiAgICBhZGRSb3cocm93OiBJRXhjZWxSb3cpOiBJRXhjZWxCdWlsZGVyO1xyXG4gICAgYWRkUm93cyhyb3dzOiBJRXhjZWxSb3dbXSk6IElFeGNlbEJ1aWxkZXJcclxuICAgIGJ1aWxkKCk6IElXb3JrU2hlZXQ7XHJcbn1cclxuXHJcbmNsYXNzIEV4Y2VsQnVpbGRlciBpbXBsZW1lbnRzIElFeGNlbEJ1aWxkZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5yb3dzID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Q3VycmVuY3koY3VycmVuY3k6IHN0cmluZyk6IElFeGNlbEJ1aWxkZXIge1xyXG4gICAgICAgIHRoaXMuY3VycmVuY3lGb3JtYXQgPSBFeGNlbFV0aWxzLmdldEN1cnJlbmN5Rm9ybWF0KGN1cnJlbmN5KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBzZXROYW1lKG5hbWU6IHN0cmluZyk6IElFeGNlbEJ1aWxkZXIge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkUm93KHJvdzogSUV4Y2VsUm93KTogSUV4Y2VsQnVpbGRlciB7XHJcbiAgICAgICAgdGhpcy5yb3dzLnB1c2gocm93KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBhZGRSb3dzKHJvd3M6IElFeGNlbFJvd1tdKTogSUV4Y2VsQnVpbGRlciB7XHJcbiAgICAgICAgcm93cy5mb3JFYWNoKCB4ID0+IHRoaXMuYWRkUm93KHgpKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBidWlsZCgpOiBJV29ya1NoZWV0IHtcclxuICAgICAgICB2YXIgd29ya3NoZWV0ID0gbmV3IFdvcmtTaGVldCh0aGlzLm5hbWUpO1xyXG5cclxuICAgICAgICB0aGlzLnJvd3MuZm9yRWFjaCgocm93LCByb3dJZHgpID0+IHtcclxuICAgICAgICAgICAgcm93LmNlbGxzLmZvckVhY2goKGNlbGwsIGNlbGxJZHgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmKGNlbGwgaW5zdGFuY2VvZiBDdXJyZW5jeUNlbGwpXHJcbiAgICAgICAgICAgICAgICAgICAgY2VsbC5zZXRGb3JtYXQodGhpcy5jdXJyZW5jeUZvcm1hdCk7XHJcbiAgICAgICAgICAgICAgICB3b3Jrc2hlZXQuc2V0Q2VsbChyb3dJZHgsIGNlbGxJZHgsIG51bGwsIGNlbGwpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHdvcmtzaGVldDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGN1cnJlbmN5Rm9ybWF0OiBzdHJpbmc7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICBwcml2YXRlIHJvd3M6IElFeGNlbFJvd1tdO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUV4Y2VsUm93IHtcclxuICAgIGFkZEVtcHR5KGNvdW50PzpudW1iZXIpOiBJRXhjZWxSb3c7XHJcbiAgICBhZGRTdHJpbmcodmFsdWU/OiBzdHJpbmcpOiBJRXhjZWxSb3c7XHJcbiAgICBhZGRTdHJpbmdzKHZhbHVlczogc3RyaW5nW10pOiBJRXhjZWxSb3c7XHJcbiAgICBhZGROdW1iZXIodmFsdWU/OiBudW1iZXIpOiBJRXhjZWxSb3c7XHJcbiAgICBhZGROdW1iZXJzKHZhbHVlczogbnVtYmVyW10pOiBJRXhjZWxSb3c7XHJcbiAgICBhZGRDdXJyZW5jeSh2YWx1ZT86IG51bWJlcik6IElFeGNlbFJvdztcclxuICAgIGFkZEN1cnJlbmNpZXModmFsdWVzOiBudW1iZXJbXSk6IElFeGNlbFJvdztcclxuICAgIGFkZERhdGUoaXNvRGF0ZT86IHN0cmluZyk6IElFeGNlbFJvdztcclxuICAgIGFkZERhdGVzKGlzb0RhdGVzOiBzdHJpbmdbXSk6IElFeGNlbFJvdztcclxuICAgIGFkZFRpbWUoaXNvVGltZT86IHN0cmluZyk6IElFeGNlbFJvdztcclxuICAgIGFkZFRpbWVzKGlzb1RpbWVzOiBzdHJpbmdbXSk6IElFeGNlbFJvdztcclxuICAgIGFkZENlbGwoY2VsbDogSUNlbGwpOiBJRXhjZWxSb3c7XHJcbiAgICBhZGRDZWxscyhjZWxsczogSUNlbGxbXSk6IElFeGNlbFJvdztcclxuICAgIGNlbGxzOiBJQ2VsbFtdO1xyXG59XHJcblxyXG5jbGFzcyBFeGNlbFJvdyBpbXBsZW1lbnRzIElFeGNlbFJvdyB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmNlbGxzID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgYWRkRW1wdHkoY291bnQ6bnVtYmVyID0gMSk6IElFeGNlbFJvdyB7XHJcbiAgICAgICAgZm9yKGxldCBpPTA7IGk8Y291bnQ7IGkrKylcclxuICAgICAgICAgICAgdGhpcy5hZGRTdHJpbmcoKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBhZGRTdHJpbmcodmFsdWU/OiBzdHJpbmcpOiBJRXhjZWxSb3cge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmFkZENlbGwobmV3IFN0cmluZ0NlbGwodmFsdWUpKTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRTdHJpbmdzKHZhbHVlczogc3RyaW5nW10pOiBJRXhjZWxSb3cge1xyXG4gICAgICAgIHZhbHVlcy5mb3JFYWNoKCB4ID0+IHRoaXMuYWRkU3RyaW5nKHgpKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBhZGROdW1iZXIodmFsdWU/OiBudW1iZXIpOiBJRXhjZWxSb3cge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmFkZENlbGwobmV3IE51bWJlckNlbGwodmFsdWUpKTtcclxuICAgIH1cclxuXHJcbiAgICBhZGROdW1iZXJzKHZhbHVlczogbnVtYmVyW10pOiBJRXhjZWxSb3cge1xyXG4gICAgICAgIHZhbHVlcy5mb3JFYWNoKCB4ID0+IHRoaXMuYWRkTnVtYmVyKHgpKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBhZGRDdXJyZW5jeSh2YWx1ZT86IG51bWJlciwgZm9ybWF0Pzogc3RyaW5nKTogSUV4Y2VsUm93IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hZGRDZWxsKG5ldyBDdXJyZW5jeUNlbGwodmFsdWUsIGZvcm1hdCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZEN1cnJlbmNpZXModmFsdWVzOiBudW1iZXJbXSk6IElFeGNlbFJvdyB7XHJcbiAgICAgICAgdmFsdWVzLmZvckVhY2goIHggPT4gdGhpcy5hZGRDdXJyZW5jeSh4KSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkRGF0ZShpc29EYXRlPzogc3RyaW5nKTogSUV4Y2VsUm93IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hZGRDZWxsKG5ldyBEYXRlQ2VsbChpc29EYXRlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkRGF0ZXMoaXNvRGF0ZXM6IHN0cmluZ1tdKTogSUV4Y2VsUm93IHtcclxuICAgICAgICBpc29EYXRlcy5mb3JFYWNoKCB4ID0+IHRoaXMuYWRkRGF0ZSh4KSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkVGltZShpc29UaW1lPzogc3RyaW5nLCBmb3JtYXQ/OiBzdHJpbmcpOiBJRXhjZWxSb3cge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmFkZENlbGwobmV3IFRpbWVDZWxsKGlzb1RpbWUsIGZvcm1hdCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFRpbWVzKGlzb1RpbWVzOiBzdHJpbmdbXSk6IElFeGNlbFJvdyB7XHJcbiAgICAgICAgaXNvVGltZXMuZm9yRWFjaCggeCA9PiB0aGlzLmFkZFRpbWUoeCkpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZENlbGwoY2VsbDogSUNlbGwpOiBJRXhjZWxSb3cge1xyXG4gICAgICAgIHRoaXMuY2VsbHMucHVzaChjZWxsKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBhZGRDZWxscyhjZWxsczogSUNlbGxbXSk6IElFeGNlbFJvdyB7XHJcbiAgICAgICAgY2VsbHMuZm9yRWFjaCggeCA9PiB0aGlzLmFkZENlbGwoeCkpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjZWxsczogSUNlbGxbXTtcclxufSIsImludGVyZmFjZSBJV29ya1NoZWV0QnVpbGRlcjxUPiB7XHJcbiAgICBhZGRUaW1lQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSwgZm9ybWF0Pzogc3RyaW5nKTogSVdvcmtTaGVldEJ1aWxkZXI8VD5cclxuICAgIGFkZERhdGVDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55KTogSVdvcmtTaGVldEJ1aWxkZXI8VD47XHJcbiAgICBhZGROdW1iZXJDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55KTogSVdvcmtTaGVldEJ1aWxkZXI8VD5cclxuICAgIGFkZEN1cnJlbmN5Q29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSwgZ2V0Q3VycmVuY3k/OiAoeDogVCkgPT4gc3RyaW5nKTogSVdvcmtTaGVldEJ1aWxkZXI8VD5cclxuICAgIGFkZENvbHVtbihuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246ICh4OiBUKSA9PiBhbnksIGNyZWF0ZUNlbGw/OiAoeDogYW55KSA9PiBJQ2VsbCk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+O1xyXG4gICAgc2V0TmFtZShuYW1lOiBzdHJpbmcpOiBJV29ya1NoZWV0QnVpbGRlcjxUPjtcclxuICAgIHNldEN1cnJlbmN5KGN1cnJlbmN5Rm9ybWF0OiBzdHJpbmcpOiBJV29ya1NoZWV0QnVpbGRlcjxUPjtcclxuICAgIGJ1aWxkKCk6IElXb3JrU2hlZXQ7XHJcbn1cclxuXHJcbmNsYXNzIFdvcmtTaGVldEJ1aWxkZXI8VD4gaW1wbGVtZW50cyBJV29ya1NoZWV0QnVpbGRlcjxUPiB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHZhbHVlczogVFtdKSB7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5zID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgYWRkVGltZUNvbHVtbihuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246ICh4OiBUKSA9PiBhbnksIGZvcm1hdD86IHN0cmluZyk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgICAgICB0aGlzLmNvbHVtbnMucHVzaCh7IG5hbWU6IG5hbWUsIGV4cHJlc3Npb246IGV4cHJlc3Npb24sIGNyZWF0ZUNlbGw6IHggPT4gbmV3IFRpbWVDZWxsKHgsIGZvcm1hdCkgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkRGF0ZUNvbHVtbihuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246ICh4OiBUKSA9PiBhbnkpOiBJV29ya1NoZWV0QnVpbGRlcjxUPiB7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5zLnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiBuYW1lLFxyXG4gICAgICAgICAgICBleHByZXNzaW9uOiBleHByZXNzaW9uLFxyXG4gICAgICAgICAgICBjcmVhdGVDZWxsOiB4ID0+IG5ldyBEYXRlQ2VsbCh4KVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZE51bWJlckNvbHVtbihuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246ICh4OiBUKSA9PiBhbnkpOiBJV29ya1NoZWV0QnVpbGRlcjxUPiB7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5zLnB1c2goeyBuYW1lOiBuYW1lLCBleHByZXNzaW9uOiBleHByZXNzaW9uLCBjcmVhdGVDZWxsOiB4ID0+IG5ldyBOdW1iZXJDZWxsKHgpIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZEN1cnJlbmN5Q29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSwgZ2V0Q3VycmVuY3k/OiAoeDogVCkgPT4gc3RyaW5nKTogSVdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgICAgIHRoaXMuY29sdW1ucy5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogbmFtZSwgZXhwcmVzc2lvbjogZXhwcmVzc2lvbiwgY3JlYXRlQ2VsbDogKHZhbHVlLCB4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm9ybWF0ID0gZ2V0Q3VycmVuY3kgPyBFeGNlbFV0aWxzLmdldEN1cnJlbmN5Rm9ybWF0KGdldEN1cnJlbmN5KHgpKSA6IHRoaXMuY3VycmVuY3lGb3JtYXQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEN1cnJlbmN5Q2VsbCh2YWx1ZSwgZm9ybWF0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZENvbHVtbihuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246ICh4OiBUKSA9PiBhbnksIGNyZWF0ZUNlbGw/OiAoeDogYW55KSA9PiBJQ2VsbCk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgICAgICB0aGlzLmNvbHVtbnMucHVzaCh7IG5hbWU6IG5hbWUsIGV4cHJlc3Npb246IGV4cHJlc3Npb24sIGNyZWF0ZUNlbGw6IGNyZWF0ZUNlbGwgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Q3VycmVuY3koY3VycmVuY3k6IHN0cmluZyk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgICAgICB0aGlzLmN1cnJlbmN5Rm9ybWF0ID0gRXhjZWxVdGlscy5nZXRDdXJyZW5jeUZvcm1hdChjdXJyZW5jeSlcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBzZXROYW1lKG5hbWU6IHN0cmluZyk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGJ1aWxkKCk6IElXb3JrU2hlZXQge1xyXG4gICAgICAgIHZhciB3b3Jrc2hlZXQgPSBuZXcgV29ya1NoZWV0KHRoaXMubmFtZSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGNvbElkeCA9IDA7IGNvbElkeCA8IHRoaXMuY29sdW1ucy5sZW5ndGg7IGNvbElkeCsrKSB7XHJcbiAgICAgICAgICAgIGxldCBjb2x1bW4gPSB0aGlzLmNvbHVtbnNbY29sSWR4XTtcclxuICAgICAgICAgICAgd29ya3NoZWV0LnNldENlbGwoMCwgY29sSWR4LCBjb2x1bW4ubmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnZhbHVlcy5mb3JFYWNoKCh4LCByb3dJZHgpID0+IHtcclxuICAgICAgICAgICAgZm9yIChsZXQgY29sSWR4ID0gMDsgY29sSWR4IDwgdGhpcy5jb2x1bW5zLmxlbmd0aDsgY29sSWR4KyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb2x1bW4gPSB0aGlzLmNvbHVtbnNbY29sSWR4XTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gY29sdW1uLmV4cHJlc3Npb24oeCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjZWxsID0gY29sdW1uLmNyZWF0ZUNlbGwgPyBjb2x1bW4uY3JlYXRlQ2VsbCh2YWx1ZSwgeCkgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgd29ya3NoZWV0LnNldENlbGwocm93SWR4ICsgMSwgY29sSWR4LCB2YWx1ZSwgY2VsbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHdvcmtzaGVldDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG5hbWU6IHN0cmluZztcclxuICAgIHByaXZhdGUgY3VycmVuY3lGb3JtYXQ6IHN0cmluZztcclxuICAgIHByaXZhdGUgY29sdW1uczogeyBuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246ICh4OiBUKSA9PiBhbnksIGNyZWF0ZUNlbGw/OiAodmFsdWU6IGFueSwgeDogVCkgPT4gSUNlbGwgfVtdO1xyXG59IiwiaW50ZXJmYWNlIElFeGNlbENvbnZlcnRlciB7XHJcbiAgICBjcmVhdGUoKTogSVdvcmtCb29rO1xyXG4gICAgY3JlYXRlQnVpbGRlcjxUPih2YWx1ZXM6IFRbXSk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+O1xyXG4gICAgY3JlYXRlQ29tcGxleEJ1aWxkZXIoKTogSUV4Y2VsQnVpbGRlcjtcclxuICAgIHNhdmVBcyhuYW1lOiBzdHJpbmcsIHdvcmtib29rOiBJV29ya0Jvb2spO1xyXG59XHJcblxyXG5jbGFzcyBFeGNlbENvbnZlcnRlciBpbXBsZW1lbnRzIElFeGNlbENvbnZlcnRlciB7XHJcblxyXG4gICAgY3JlYXRlKCk6IElXb3JrQm9vayB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBXb3JrQm9vayhudWxsKTtcclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVCdWlsZGVyPFQ+KHZhbHVlczogVFtdKTogSVdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgV29ya1NoZWV0QnVpbGRlcih2YWx1ZXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGNyZWF0ZUNvbXBsZXhCdWlsZGVyKCk6IElFeGNlbEJ1aWxkZXIge1xyXG4gICAgICAgIHJldHVybiBuZXcgRXhjZWxCdWlsZGVyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2F2ZUFzKG5hbWU6IHN0cmluZywgd29ya2Jvb2s6IElXb3JrQm9vaykge1xyXG4gICAgICAgIHdvcmtib29rLnNhdmVBcyhuYW1lKTtcclxuICAgIH1cclxufVxyXG5cclxuQW5ndWxhci5tb2R1bGUoXCJhbmd1bGFyLWV4Y2VsXCIpLnNlcnZpY2UoJ2V4Y2VsQ29udmVydGVyJywgRXhjZWxDb252ZXJ0ZXIpOyJdfQ==