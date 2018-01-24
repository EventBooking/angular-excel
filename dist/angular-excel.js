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
    var ExcelRun = /** @class */ (function () {
        function ExcelRun(saveAs, xlsx, currency, accounting) {
            ExcelUtils.bootstrap(saveAs, xlsx, currency, accounting);
        }
        ExcelRun.$inject = ["saveAs", "XLSX", "currency", "accounting"];
        return ExcelRun;
    }());
    Angular.module("angular-excel", [])
        .constant("saveAs", saveAs)
        .constant("XLSX", XLSX)
        .constant("currency", currency)
        .constant("accounting", accounting)
        .run(ExcelRun);
})(excel || (excel = {}));
var ExcelUtils = /** @class */ (function () {
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
var CellAddress = /** @class */ (function () {
    function CellAddress(row, col) {
        this.r = row;
        this.c = col;
    }
    return CellAddress;
}());
var CellRange = /** @class */ (function () {
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
var Cell = /** @class */ (function () {
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
var DateCell = /** @class */ (function (_super) {
    __extends(DateCell, _super);
    function DateCell(isoDate) {
        var _this = _super.call(this) || this;
        _this.setValue(isoDate, 'd');
        return _this;
    }
    return DateCell;
}(Cell));
var CurrencyCell = /** @class */ (function (_super) {
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
var TimeCell = /** @class */ (function (_super) {
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
var NumberCell = /** @class */ (function (_super) {
    __extends(NumberCell, _super);
    function NumberCell(value) {
        var _this = _super.call(this) || this;
        _this.setValue(value, 'n');
        return _this;
    }
    return NumberCell;
}(Cell));
var StringCell = /** @class */ (function (_super) {
    __extends(StringCell, _super);
    function StringCell(value) {
        var _this = _super.call(this) || this;
        _this.setValue(value, 's');
        return _this;
    }
    return StringCell;
}(Cell));
var WorkSheet = /** @class */ (function () {
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
var WorkBook = /** @class */ (function () {
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
var ExcelBuilder = /** @class */ (function () {
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
var ExcelRow = /** @class */ (function () {
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
var WorkSheetBuilder = /** @class */ (function () {
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
var ExcelConverter = /** @class */ (function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ndWxhci1leGNlbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9hcHAudHMiLCIuLi9zcmMvdXRpbHMudHMiLCIuLi9zcmMvY2VsbEFkZHJlc3MudHMiLCIuLi9zcmMvY2VsbFJhbmdlLnRzIiwiLi4vc3JjL2NlbGwudHMiLCIuLi9zcmMvd29ya3NoZWV0LnRzIiwiLi4vc3JjL3dvcmtib29rLnRzIiwiLi4vc3JjL2V4Y2VsQnVpbGRlci50cyIsIi4uL3NyYy93b3Jrc2hlZXRCdWlsZGVyLnRzIiwiLi4vc3JjL2V4Y2VsQ29udmVydGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxJQUFVLEtBQUssQ0FxQmQ7QUFyQkQsV0FBVSxLQUFLO0lBT1g7UUFHSSxrQkFBWSxNQUFXLEVBQUUsSUFBUyxFQUFFLFFBQWEsRUFBRSxVQUFlO1lBQzlELFVBQVUsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDN0QsQ0FBQztRQUpNLGdCQUFPLEdBQUcsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUtsRSxlQUFDO0tBQUEsQUFORCxJQU1DO0lBRUQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsRUFBRSxDQUFDO1NBQzlCLFFBQVEsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDO1NBQzFCLFFBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDO1NBQ3RCLFFBQVEsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDO1NBQzlCLFFBQVEsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDO1NBQ2xDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN2QixDQUFDLEVBckJTLEtBQUssS0FBTCxLQUFLLFFBcUJkO0FDckJEO0lBQUE7SUFpRUEsQ0FBQztJQTNEVSxvQkFBUyxHQUFoQixVQUFpQixNQUFXLEVBQUUsSUFB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QUFNLEdBQU47UUFDSSxNQUFNLENBQUMsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUVELHNDQUFhLEdBQWIsVUFBaUIsTUFBVztRQUN4QixNQUFNLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRUQsNkNBQW9CLEdBQXBCO1FBQ0ksTUFBTSxDQUFDLElBQUksWUFBWSxFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUVELCtCQUFNLEdBQU4sVUFBTyxJQUFZLEVBQUUsUUFBbUI7UUFDcEMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBQ0wscUJBQUM7QUFBRCxDQUFDLEFBakJELElBaUJDO0FBRUQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJuYW1lc3BhY2UgZXhjZWwge1xyXG4gICAgZGVjbGFyZSB2YXIgWExTWDogYW55O1xyXG4gICAgZGVjbGFyZSB2YXIgc2F2ZUFzOiBhbnk7XHJcbiAgICBkZWNsYXJlIHZhciBtb21lbnQ6IGFueTtcclxuICAgIGRlY2xhcmUgdmFyIGN1cnJlbmN5OiBhbnk7XHJcbiAgICBkZWNsYXJlIHZhciBhY2NvdW50aW5nOiBhbnk7XHJcblxyXG4gICAgY2xhc3MgRXhjZWxSdW4ge1xyXG4gICAgICAgIHN0YXRpYyAkaW5qZWN0ID0gW1wic2F2ZUFzXCIsIFwiWExTWFwiLCBcImN1cnJlbmN5XCIsIFwiYWNjb3VudGluZ1wiXTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3Ioc2F2ZUFzOiBhbnksIHhsc3g6IGFueSwgY3VycmVuY3k6IGFueSwgYWNjb3VudGluZzogYW55KSB7XHJcbiAgICAgICAgICAgIEV4Y2VsVXRpbHMuYm9vdHN0cmFwKHNhdmVBcywgeGxzeCwgY3VycmVuY3ksIGFjY291bnRpbmcpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBBbmd1bGFyLm1vZHVsZShcImFuZ3VsYXItZXhjZWxcIiwgW10pXHJcbiAgICAgICAgLmNvbnN0YW50KFwic2F2ZUFzXCIsIHNhdmVBcylcclxuICAgICAgICAuY29uc3RhbnQoXCJYTFNYXCIsIFhMU1gpXHJcbiAgICAgICAgLmNvbnN0YW50KFwiY3VycmVuY3lcIiwgY3VycmVuY3kpXHJcbiAgICAgICAgLmNvbnN0YW50KFwiYWNjb3VudGluZ1wiLCBhY2NvdW50aW5nKVxyXG4gICAgICAgIC5ydW4oRXhjZWxSdW4pO1xyXG59IiwiY2xhc3MgRXhjZWxVdGlscyB7XHJcbiAgICBwcml2YXRlIHN0YXRpYyBzYXZlQXM6IGFueTtcclxuICAgIHByaXZhdGUgc3RhdGljIHhsc3g6IGFueTtcclxuICAgIHByaXZhdGUgc3RhdGljIGN1cnJlbmN5OiBhbnk7XHJcbiAgICBwcml2YXRlIHN0YXRpYyBhY2NvdW50aW5nOiBhbnk7XHJcblxyXG4gICAgc3RhdGljIGJvb3RzdHJhcChzYXZlQXM6IGFueSwgeGxzeCwgY3VycmVuY3k6IGFueSwgYWNjb3VudGluZzogYW55KSB7XHJcbiAgICAgICAgRXhjZWxVdGlscy5zYXZlQXMgPSBzYXZlQXM7XHJcbiAgICAgICAgRXhjZWxVdGlscy54bHN4ID0geGxzeDtcclxuICAgICAgICBFeGNlbFV0aWxzLmN1cnJlbmN5ID0gY3VycmVuY3k7XHJcbiAgICAgICAgRXhjZWxVdGlscy5hY2NvdW50aW5nID0gYWNjb3VudGluZztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGVuY29kZUNlbGwoYWRkcmVzczogSUNlbGxBZGRyZXNzKSB7XHJcbiAgICAgICAgcmV0dXJuIEV4Y2VsVXRpbHMueGxzeC51dGlscy5lbmNvZGVfY2VsbChhZGRyZXNzKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGVuY29kZVJhbmdlKHJhbmdlOiBJQ2VsbFJhbmdlKSB7XHJcbiAgICAgICAgcmV0dXJuIEV4Y2VsVXRpbHMueGxzeC51dGlscy5lbmNvZGVfcmFuZ2UocmFuZ2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0Q3VycmVuY3lGb3JtYXQoY3VycmVuY3k6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICAgICAgY29uc3QgY3VycmVuY3lTeW1ib2wgPSBFeGNlbFV0aWxzLmN1cnJlbmN5LnN5bWJvbGl6ZShjdXJyZW5jeSk7XHJcbiAgICAgICAgY29uc3QgY3VycmVuY3lTZXR0aW5ncyA9IEV4Y2VsVXRpbHMuYWNjb3VudGluZy5zZXR0aW5ncy5jdXJyZW5jeTtcclxuICAgICAgICB2YXIgY3VycmVuY3lGb3JtYXQgPSBgJHtjdXJyZW5jeVN5bWJvbH0jJHtjdXJyZW5jeVNldHRpbmdzLnRob3VzYW5kfSMjMCR7Y3VycmVuY3lTZXR0aW5ncy5kZWNpbWFsfTAwYDtcclxuICAgICAgICByZXR1cm4gY3VycmVuY3lGb3JtYXQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBmb3JtYXRUaW1lKGlzb1RpbWU6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgICAgICAgaWYgKGlzb1RpbWUgPT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBjb25zdCBTRUNPTkRTX0lOX0RBWSA9IDg2NDAwO1xyXG4gICAgICAgIGNvbnN0IFNFQ09ORFNfSU5fSE9VUiA9IDM2MDA7XHJcbiAgICAgICAgY29uc3QgU0VDT05EU19JTl9NSU5VVEUgPSA2MDtcclxuXHJcbiAgICAgICAgY29uc3QgdmFsdWVzID0gaXNvVGltZS5zcGxpdChcIjpcIik7XHJcbiAgICAgICAgY29uc3QgaG91clNlY29uZHMgPSBOdW1iZXIodmFsdWVzWzBdKSAqIFNFQ09ORFNfSU5fSE9VUjtcclxuICAgICAgICBjb25zdCBtaW51dGVTZWNvbmRzID0gTnVtYmVyKHZhbHVlc1sxXSkgKiBTRUNPTkRTX0lOX01JTlVURTtcclxuICAgICAgICBjb25zdCBzZWNvbmRzID0gTnVtYmVyKHZhbHVlc1syXSk7XHJcbiAgICAgICAgY29uc3QgdG90YWxTZWNvbmRzID0gaG91clNlY29uZHMgKyBtaW51dGVTZWNvbmRzICsgc2Vjb25kcztcclxuICAgICAgICBjb25zdCB2YWx1ZSA9IHRvdGFsU2Vjb25kcyAvIFNFQ09ORFNfSU5fREFZO1xyXG4gICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGNvbnZlcnRUb0JpbmFyeSh3b3JrYm9vazogc3RyaW5nKTogQXJyYXlCdWZmZXIge1xyXG4gICAgICAgIHZhciBidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIod29ya2Jvb2subGVuZ3RoKTtcclxuICAgICAgICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgIT09IHdvcmtib29rLmxlbmd0aDsgKytpKVxyXG4gICAgICAgICAgICB2aWV3W2ldID0gd29ya2Jvb2suY2hhckNvZGVBdChpKSAmIDB4RkY7XHJcbiAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIHdyaXRlV29ya2Jvb2sod29ya2Jvb2s6IElXb3JrQm9vaywgb3B0aW9ucz86IGFueSwgZW5hYmxlTGVnYWN5U2FmYXJpU3VwcG9ydCA9IHRydWUpOiBzdHJpbmcge1xyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHtcclxuICAgICAgICAgICAgYm9va1R5cGU6ICd4bHN4JywgXHJcbiAgICAgICAgICAgIHR5cGU6ICdiaW5hcnknXHJcbiAgICAgICAgfTtcclxuICAgICAgICBvcHRpb25zLmJvb2tTU1QgPSBlbmFibGVMZWdhY3lTYWZhcmlTdXBwb3J0O1xyXG4gICAgICAgIHJldHVybiB0aGlzLnhsc3gud3JpdGUod29ya2Jvb2ssIG9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgc2F2ZUJ1ZmZlcihuYW1lOiBzdHJpbmcsIGJ1ZmZlcjogQXJyYXlCdWZmZXIpIHtcclxuICAgICAgICBFeGNlbFV0aWxzLnNhdmVBcyhuZXcgQmxvYihbYnVmZmVyXSwgeyB0eXBlOiBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiIH0pLCBgJHtuYW1lfS54bHN4YCk7XHJcbiAgICB9XHJcbn0iLCJpbnRlcmZhY2UgSUNlbGxBZGRyZXNzIHtcclxuICAgIGM6IG51bWJlcjtcclxuICAgIHI6IG51bWJlcjtcclxufVxyXG5cclxuY2xhc3MgQ2VsbEFkZHJlc3MgaW1wbGVtZW50cyBJQ2VsbEFkZHJlc3Mge1xyXG4gICAgY29uc3RydWN0b3Iocm93OiBudW1iZXIsIGNvbDogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5yID0gcm93O1xyXG4gICAgICAgIHRoaXMuYyA9IGNvbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyAwLWluZGV4ZWQgY29sdW1uXHJcbiAgICBjOiBudW1iZXI7XHJcbiAgICAvLyAwLWluZGV4ZWQgcm93XHJcbiAgICByOiBudW1iZXI7XHJcbn0iLCJpbnRlcmZhY2UgSUNlbGxSYW5nZSB7XHJcbiAgICBhZGRBZGRyZXNzKGFkZHJlc3M6IElDZWxsQWRkcmVzcyk7XHJcbn1cclxuXHJcbmNsYXNzIENlbGxSYW5nZSBpbXBsZW1lbnRzIElDZWxsUmFuZ2Uge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5zID0gbmV3IENlbGxBZGRyZXNzKDAsIDApO1xyXG4gICAgICAgIHRoaXMuZSA9IG5ldyBDZWxsQWRkcmVzcygwLCAwKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBzdGFydFxyXG4gICAgczogQ2VsbEFkZHJlc3M7XHJcbiAgICAvLyBlbmRcclxuICAgIGU6IENlbGxBZGRyZXNzO1xyXG5cclxuICAgIGFkZEFkZHJlc3MoYWRkcmVzczogSUNlbGxBZGRyZXNzKSB7XHJcbiAgICAgICAgaWYgKGFkZHJlc3MuciA8IHRoaXMucy5yKVxyXG4gICAgICAgICAgICB0aGlzLnMuciA9IGFkZHJlc3MucjtcclxuICAgICAgICBpZiAoYWRkcmVzcy5jIDwgdGhpcy5zLmMpXHJcbiAgICAgICAgICAgIHRoaXMucy5jID0gYWRkcmVzcy5jO1xyXG5cclxuICAgICAgICBpZiAoYWRkcmVzcy5yID4gdGhpcy5lLnIpXHJcbiAgICAgICAgICAgIHRoaXMuZS5yID0gYWRkcmVzcy5yO1xyXG4gICAgICAgIGlmIChhZGRyZXNzLmMgPiB0aGlzLmUuYylcclxuICAgICAgICAgICAgdGhpcy5lLmMgPSBhZGRyZXNzLmM7XHJcbiAgICB9XHJcbn0iLCIvLyBzZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9TaGVldEpTL2pzLXhsc3gjY2VsbC1vYmplY3RcclxuXHJcbmludGVyZmFjZSBJQ2VsbCB7XHJcbiAgICB2OiBzdHJpbmc7XHJcbiAgICB3OiBzdHJpbmc7XHJcbiAgICB0OiBzdHJpbmc7XHJcbiAgICBmOiBzdHJpbmc7XHJcbiAgICBGOiBzdHJpbmc7XHJcbiAgICByOiBzdHJpbmc7XHJcbiAgICBoOiBzdHJpbmc7XHJcbiAgICBjOiBzdHJpbmc7XHJcbiAgICB6OiBzdHJpbmc7XHJcbiAgICBsOiBzdHJpbmc7XHJcbiAgICBzOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNsYXNzIENlbGwgaW1wbGVtZW50cyBJQ2VsbCB7XHJcbiAgICBwcm90ZWN0ZWQgc2V0VmFsdWUodmFsdWU6IGFueSwgdHlwZTogc3RyaW5nLCBmb3JtYXQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMudiA9IHZhbHVlLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgdGhpcy50ID0gdHlwZTtcclxuICAgICAgICB0aGlzLnogPSBmb3JtYXQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIHNldEZvcm1hdChmb3JtYXQ/OiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLnogPSBmb3JtYXQ7XHJcbiAgICB9XHJcblxyXG4gICAgdjogc3RyaW5nO1xyXG4gICAgdzogc3RyaW5nO1xyXG4gICAgdDogc3RyaW5nO1xyXG4gICAgZjogc3RyaW5nO1xyXG4gICAgRjogc3RyaW5nO1xyXG4gICAgcjogc3RyaW5nO1xyXG4gICAgaDogc3RyaW5nO1xyXG4gICAgYzogc3RyaW5nO1xyXG4gICAgejogc3RyaW5nO1xyXG4gICAgbDogc3RyaW5nO1xyXG4gICAgczogc3RyaW5nO1xyXG59XHJcblxyXG5jbGFzcyBEYXRlQ2VsbCBleHRlbmRzIENlbGwge1xyXG4gICAgY29uc3RydWN0b3IoaXNvRGF0ZTogc3RyaW5nKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLnNldFZhbHVlKGlzb0RhdGUsICdkJyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEN1cnJlbmN5Q2VsbCBleHRlbmRzIENlbGwge1xyXG4gICAgY29uc3RydWN0b3IodmFsdWU6IG51bWJlciwgZm9ybWF0OiBzdHJpbmcgPSBcIiQjLCMjMC4wMFwiKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLnNldFZhbHVlKHZhbHVlLCAnbicsIGZvcm1hdCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Rm9ybWF0KGZvcm1hdDogc3RyaW5nKSB7XHJcbiAgICAgICAgc3VwZXIuc2V0Rm9ybWF0KGZvcm1hdCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFRpbWVDZWxsIGV4dGVuZHMgQ2VsbCB7XHJcbiAgICBjb25zdHJ1Y3Rvcihpc29UaW1lOiBzdHJpbmcsIGZvcm1hdDogc3RyaW5nID0gXCJoOm1tIEFNL1BNXCIpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gRXhjZWxVdGlscy5mb3JtYXRUaW1lKGlzb1RpbWUpO1xyXG4gICAgICAgIHRoaXMuc2V0VmFsdWUodmFsdWUsICduJywgZm9ybWF0KTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgTnVtYmVyQ2VsbCBleHRlbmRzIENlbGwge1xyXG4gICAgY29uc3RydWN0b3IodmFsdWU/OiBhbnkpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuc2V0VmFsdWUodmFsdWUsICduJyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFN0cmluZ0NlbGwgZXh0ZW5kcyBDZWxsIHtcclxuICAgIGNvbnN0cnVjdG9yKHZhbHVlPzogYW55KSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLnNldFZhbHVlKHZhbHVlLCAncycpO1xyXG4gICAgfVxyXG59IiwiaW50ZXJmYWNlIElXb3JrU2hlZXQge1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgc2V0Q2VsbChyb3c6IG51bWJlciwgY29sOiBudW1iZXIsIHZhbHVlOiBhbnksIGNlbGw/OiBJQ2VsbCk7XHJcbiAgICBnZXRDZWxsKHJvdzogbnVtYmVyLCBjb2w6IG51bWJlcik6IElDZWxsO1xyXG59XHJcblxyXG5jbGFzcyBXb3JrU2hlZXQgaW1wbGVtZW50cyBJV29ya1NoZWV0IHtcclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBuYW1lOiBzdHJpbmcgPSBcIndvcmtzaGVldFwiKSB7XHJcbiAgICAgICAgbmFtZSA9IG5hbWUuc2xpY2UoMCwgMzEpO1xyXG4gICAgICAgIHRoaXMuX3JhbmdlID0gbmV3IENlbGxSYW5nZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3JhbmdlOiBJQ2VsbFJhbmdlO1xyXG5cclxuICAgIHNldENlbGwocm93OiBudW1iZXIsIGNvbDogbnVtYmVyLCB2YWx1ZTogYW55LCBjZWxsPzogSUNlbGwpIHtcclxuICAgICAgICB2YXIgYWRkcmVzcyA9IG5ldyBDZWxsQWRkcmVzcyhyb3csIGNvbCk7XHJcbiAgICAgICAgaWYgKCFjZWxsKVxyXG4gICAgICAgICAgICBjZWxsID0gbmV3IFN0cmluZ0NlbGwodmFsdWUpO1xyXG5cclxuICAgICAgICB2YXIgY2VsbFJlZmVyZW5jZSA9IEV4Y2VsVXRpbHMuZW5jb2RlQ2VsbChhZGRyZXNzKTtcclxuICAgICAgICB0aGlzW2NlbGxSZWZlcmVuY2VdID0gY2VsbDtcclxuXHJcbiAgICAgICAgdGhpcy5fcmFuZ2UuYWRkQWRkcmVzcyhhZGRyZXNzKTtcclxuICAgICAgICB0aGlzW1wiIXJlZlwiXSA9IEV4Y2VsVXRpbHMuZW5jb2RlUmFuZ2UodGhpcy5fcmFuZ2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldENlbGwocm93OiBudW1iZXIsIGNvbDogbnVtYmVyKTogSUNlbGwge1xyXG4gICAgICAgIHZhciBhZGRyZXNzID0gbmV3IENlbGxBZGRyZXNzKHJvdywgY29sKTtcclxuICAgICAgICB2YXIgY2VsbFJlZmVyZW5jZSA9IEV4Y2VsVXRpbHMuZW5jb2RlQ2VsbChhZGRyZXNzKTtcclxuICAgICAgICB2YXIgY2VsbCA9IHRoaXNbY2VsbFJlZmVyZW5jZV07XHJcbiAgICAgICAgcmV0dXJuIGNlbGw7XHJcbiAgICB9XHJcbn0iLCJpbnRlcmZhY2UgSVdvcmtCb29rIHtcclxuICAgIGFkZFdvcmtTaGVldCh3czogc3RyaW5nIHwgSVdvcmtTaGVldCk6IElXb3JrU2hlZXQ7XHJcbiAgICBzYXZlKCk7XHJcbiAgICBzYXZlQXMobmFtZTogc3RyaW5nKTtcclxufVxyXG5cclxuY2xhc3MgV29ya0Jvb2sgaW1wbGVtZW50cyBJV29ya0Jvb2sge1xyXG4gICAgY29uc3RydWN0b3IocHVibGljIG5hbWU6IHN0cmluZyA9IFwiV29ya2Jvb2tcIikge1xyXG4gICAgICAgIHRoaXNbJ1NoZWV0TmFtZXMnXSA9IFtdO1xyXG4gICAgICAgIHRoaXNbJ1NoZWV0cyddID0ge307XHJcbiAgICB9XHJcblxyXG4gICAgYWRkV29ya1NoZWV0KHdvcmtzaGVldDogc3RyaW5nIHwgSVdvcmtTaGVldCk6IElXb3JrU2hlZXQge1xyXG4gICAgICAgIGlmICh0eXBlb2Ygd29ya3NoZWV0ID09IFwic3RyaW5nXCIpXHJcbiAgICAgICAgICAgIHdvcmtzaGVldCA9IG5ldyBXb3JrU2hlZXQod29ya3NoZWV0KTtcclxuXHJcbiAgICAgICAgY29uc3QgbmFtZSA9IHdvcmtzaGVldC5uYW1lO1xyXG4gICAgICAgIGxldCBzaGVldE5hbWVzOiBzdHJpbmdbXSA9IHRoaXNbJ1NoZWV0TmFtZXMnXTtcclxuICAgICAgICBzaGVldE5hbWVzLnB1c2gobmFtZSk7XHJcbiAgICAgICAgdGhpc1snU2hlZXRzJ11bbmFtZV0gPSB3b3Jrc2hlZXQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHdvcmtzaGVldDtcclxuICAgIH1cclxuXHJcbiAgICBzYXZlKCkge1xyXG4gICAgICAgIHRoaXMuc2F2ZUFzKHRoaXMubmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2F2ZUFzKG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IHdib3V0ID0gRXhjZWxVdGlscy53cml0ZVdvcmtib29rKHRoaXMpO1xyXG4gICAgICAgIHZhciBidWZmZXIgPSBFeGNlbFV0aWxzLmNvbnZlcnRUb0JpbmFyeSh3Ym91dCk7XHJcbiAgICAgICAgRXhjZWxVdGlscy5zYXZlQnVmZmVyKG5hbWUsIGJ1ZmZlcik7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfc2hlZXROYW1lczogc3RyaW5nW107XHJcbiAgICBwcml2YXRlIF9zaGVldHM6IHN0cmluZ1tdW107XHJcbn0iLCJpbnRlcmZhY2UgSUV4Y2VsQnVpbGRlciB7XHJcbiAgICBzZXRDdXJyZW5jeShjdXJyZW5jeTogc3RyaW5nKTogSUV4Y2VsQnVpbGRlcjtcclxuICAgIHNldE5hbWUobmFtZTogc3RyaW5nKTogSUV4Y2VsQnVpbGRlcjtcclxuICAgIGFkZFJvdyhyb3c6IElFeGNlbFJvdyk6IElFeGNlbEJ1aWxkZXI7XHJcbiAgICBhZGRSb3dzKHJvd3M6IElFeGNlbFJvd1tdKTogSUV4Y2VsQnVpbGRlclxyXG4gICAgYnVpbGQoKTogSVdvcmtTaGVldDtcclxufVxyXG5cclxuY2xhc3MgRXhjZWxCdWlsZGVyIGltcGxlbWVudHMgSUV4Y2VsQnVpbGRlciB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLnJvd3MgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRDdXJyZW5jeShjdXJyZW5jeTogc3RyaW5nKTogSUV4Y2VsQnVpbGRlciB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW5jeUZvcm1hdCA9IEV4Y2VsVXRpbHMuZ2V0Q3VycmVuY3lGb3JtYXQoY3VycmVuY3kpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHNldE5hbWUobmFtZTogc3RyaW5nKTogSUV4Y2VsQnVpbGRlciB7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBhZGRSb3cocm93OiBJRXhjZWxSb3cpOiBJRXhjZWxCdWlsZGVyIHtcclxuICAgICAgICB0aGlzLnJvd3MucHVzaChyb3cpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFJvd3Mocm93czogSUV4Y2VsUm93W10pOiBJRXhjZWxCdWlsZGVyIHtcclxuICAgICAgICByb3dzLmZvckVhY2goIHggPT4gdGhpcy5hZGRSb3coeCkpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGJ1aWxkKCk6IElXb3JrU2hlZXQge1xyXG4gICAgICAgIHZhciB3b3Jrc2hlZXQgPSBuZXcgV29ya1NoZWV0KHRoaXMubmFtZSk7XHJcblxyXG4gICAgICAgIHRoaXMucm93cy5mb3JFYWNoKChyb3csIHJvd0lkeCkgPT4ge1xyXG4gICAgICAgICAgICByb3cuY2VsbHMuZm9yRWFjaCgoY2VsbCwgY2VsbElkeCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYoY2VsbCBpbnN0YW5jZW9mIEN1cnJlbmN5Q2VsbClcclxuICAgICAgICAgICAgICAgICAgICBjZWxsLnNldEZvcm1hdCh0aGlzLmN1cnJlbmN5Rm9ybWF0KTtcclxuICAgICAgICAgICAgICAgIHdvcmtzaGVldC5zZXRDZWxsKHJvd0lkeCwgY2VsbElkeCwgbnVsbCwgY2VsbCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gd29ya3NoZWV0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3VycmVuY3lGb3JtYXQ6IHN0cmluZztcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIHByaXZhdGUgcm93czogSUV4Y2VsUm93W107XHJcbn1cclxuXHJcbmludGVyZmFjZSBJRXhjZWxSb3cge1xyXG4gICAgYWRkRW1wdHkoY291bnQ/Om51bWJlcik6IElFeGNlbFJvdztcclxuICAgIGFkZFN0cmluZyh2YWx1ZT86IHN0cmluZyk6IElFeGNlbFJvdztcclxuICAgIGFkZFN0cmluZ3ModmFsdWVzOiBzdHJpbmdbXSk6IElFeGNlbFJvdztcclxuICAgIGFkZE51bWJlcih2YWx1ZT86IG51bWJlcik6IElFeGNlbFJvdztcclxuICAgIGFkZE51bWJlcnModmFsdWVzOiBudW1iZXJbXSk6IElFeGNlbFJvdztcclxuICAgIGFkZEN1cnJlbmN5KHZhbHVlPzogbnVtYmVyKTogSUV4Y2VsUm93O1xyXG4gICAgYWRkQ3VycmVuY2llcyh2YWx1ZXM6IG51bWJlcltdKTogSUV4Y2VsUm93O1xyXG4gICAgYWRkRGF0ZShpc29EYXRlPzogc3RyaW5nKTogSUV4Y2VsUm93O1xyXG4gICAgYWRkRGF0ZXMoaXNvRGF0ZXM6IHN0cmluZ1tdKTogSUV4Y2VsUm93O1xyXG4gICAgYWRkVGltZShpc29UaW1lPzogc3RyaW5nKTogSUV4Y2VsUm93O1xyXG4gICAgYWRkVGltZXMoaXNvVGltZXM6IHN0cmluZ1tdKTogSUV4Y2VsUm93O1xyXG4gICAgYWRkQ2VsbChjZWxsOiBJQ2VsbCk6IElFeGNlbFJvdztcclxuICAgIGFkZENlbGxzKGNlbGxzOiBJQ2VsbFtdKTogSUV4Y2VsUm93O1xyXG4gICAgY2VsbHM6IElDZWxsW107XHJcbn1cclxuXHJcbmNsYXNzIEV4Y2VsUm93IGltcGxlbWVudHMgSUV4Y2VsUm93IHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuY2VsbHMgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRFbXB0eShjb3VudDpudW1iZXIgPSAxKTogSUV4Y2VsUm93IHtcclxuICAgICAgICBmb3IobGV0IGk9MDsgaTxjb3VudDsgaSsrKVxyXG4gICAgICAgICAgICB0aGlzLmFkZFN0cmluZygpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFN0cmluZyh2YWx1ZT86IHN0cmluZyk6IElFeGNlbFJvdyB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkQ2VsbChuZXcgU3RyaW5nQ2VsbCh2YWx1ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFN0cmluZ3ModmFsdWVzOiBzdHJpbmdbXSk6IElFeGNlbFJvdyB7XHJcbiAgICAgICAgdmFsdWVzLmZvckVhY2goIHggPT4gdGhpcy5hZGRTdHJpbmcoeCkpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZE51bWJlcih2YWx1ZT86IG51bWJlcik6IElFeGNlbFJvdyB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkQ2VsbChuZXcgTnVtYmVyQ2VsbCh2YWx1ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZE51bWJlcnModmFsdWVzOiBudW1iZXJbXSk6IElFeGNlbFJvdyB7XHJcbiAgICAgICAgdmFsdWVzLmZvckVhY2goIHggPT4gdGhpcy5hZGROdW1iZXIoeCkpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZEN1cnJlbmN5KHZhbHVlPzogbnVtYmVyLCBmb3JtYXQ/OiBzdHJpbmcpOiBJRXhjZWxSb3cge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmFkZENlbGwobmV3IEN1cnJlbmN5Q2VsbCh2YWx1ZSwgZm9ybWF0KSk7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkQ3VycmVuY2llcyh2YWx1ZXM6IG51bWJlcltdKTogSUV4Y2VsUm93IHtcclxuICAgICAgICB2YWx1ZXMuZm9yRWFjaCggeCA9PiB0aGlzLmFkZEN1cnJlbmN5KHgpKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBhZGREYXRlKGlzb0RhdGU/OiBzdHJpbmcpOiBJRXhjZWxSb3cge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmFkZENlbGwobmV3IERhdGVDZWxsKGlzb0RhdGUpKTtcclxuICAgIH1cclxuXHJcbiAgICBhZGREYXRlcyhpc29EYXRlczogc3RyaW5nW10pOiBJRXhjZWxSb3cge1xyXG4gICAgICAgIGlzb0RhdGVzLmZvckVhY2goIHggPT4gdGhpcy5hZGREYXRlKHgpKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBhZGRUaW1lKGlzb1RpbWU/OiBzdHJpbmcsIGZvcm1hdD86IHN0cmluZyk6IElFeGNlbFJvdyB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkQ2VsbChuZXcgVGltZUNlbGwoaXNvVGltZSwgZm9ybWF0KSk7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkVGltZXMoaXNvVGltZXM6IHN0cmluZ1tdKTogSUV4Y2VsUm93IHtcclxuICAgICAgICBpc29UaW1lcy5mb3JFYWNoKCB4ID0+IHRoaXMuYWRkVGltZSh4KSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkQ2VsbChjZWxsOiBJQ2VsbCk6IElFeGNlbFJvdyB7XHJcbiAgICAgICAgdGhpcy5jZWxscy5wdXNoKGNlbGwpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZENlbGxzKGNlbGxzOiBJQ2VsbFtdKTogSUV4Y2VsUm93IHtcclxuICAgICAgICBjZWxscy5mb3JFYWNoKCB4ID0+IHRoaXMuYWRkQ2VsbCh4KSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNlbGxzOiBJQ2VsbFtdO1xyXG59IiwiaW50ZXJmYWNlIElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgIGFkZFRpbWVDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55LCBmb3JtYXQ/OiBzdHJpbmcpOiBJV29ya1NoZWV0QnVpbGRlcjxUPlxyXG4gICAgYWRkRGF0ZUNvbHVtbihuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246ICh4OiBUKSA9PiBhbnkpOiBJV29ya1NoZWV0QnVpbGRlcjxUPjtcclxuICAgIGFkZE51bWJlckNvbHVtbihuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246ICh4OiBUKSA9PiBhbnkpOiBJV29ya1NoZWV0QnVpbGRlcjxUPlxyXG4gICAgYWRkQ3VycmVuY3lDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55LCBnZXRDdXJyZW5jeT86ICh4OiBUKSA9PiBzdHJpbmcpOiBJV29ya1NoZWV0QnVpbGRlcjxUPlxyXG4gICAgYWRkQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSwgY3JlYXRlQ2VsbD86ICh4OiBhbnkpID0+IElDZWxsKTogSVdvcmtTaGVldEJ1aWxkZXI8VD47XHJcbiAgICBzZXROYW1lKG5hbWU6IHN0cmluZyk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+O1xyXG4gICAgc2V0Q3VycmVuY3koY3VycmVuY3lGb3JtYXQ6IHN0cmluZyk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+O1xyXG4gICAgYnVpbGQoKTogSVdvcmtTaGVldDtcclxufVxyXG5cclxuY2xhc3MgV29ya1NoZWV0QnVpbGRlcjxUPiBpbXBsZW1lbnRzIElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdmFsdWVzOiBUW10pIHtcclxuICAgICAgICB0aGlzLmNvbHVtbnMgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRUaW1lQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSwgZm9ybWF0Pzogc3RyaW5nKTogSVdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgICAgIHRoaXMuY29sdW1ucy5wdXNoKHsgbmFtZTogbmFtZSwgZXhwcmVzc2lvbjogZXhwcmVzc2lvbiwgY3JlYXRlQ2VsbDogeCA9PiBuZXcgVGltZUNlbGwoeCwgZm9ybWF0KSB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBhZGREYXRlQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgICAgICB0aGlzLmNvbHVtbnMucHVzaCh7XHJcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXHJcbiAgICAgICAgICAgIGV4cHJlc3Npb246IGV4cHJlc3Npb24sXHJcbiAgICAgICAgICAgIGNyZWF0ZUNlbGw6IHggPT4gbmV3IERhdGVDZWxsKHgpXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkTnVtYmVyQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgICAgICB0aGlzLmNvbHVtbnMucHVzaCh7IG5hbWU6IG5hbWUsIGV4cHJlc3Npb246IGV4cHJlc3Npb24sIGNyZWF0ZUNlbGw6IHggPT4gbmV3IE51bWJlckNlbGwoeCkgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkQ3VycmVuY3lDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55LCBnZXRDdXJyZW5jeT86ICh4OiBUKSA9PiBzdHJpbmcpOiBJV29ya1NoZWV0QnVpbGRlcjxUPiB7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5zLnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiBuYW1lLCBleHByZXNzaW9uOiBleHByZXNzaW9uLCBjcmVhdGVDZWxsOiAodmFsdWUsIHgpID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBmb3JtYXQgPSBnZXRDdXJyZW5jeSA/IEV4Y2VsVXRpbHMuZ2V0Q3VycmVuY3lGb3JtYXQoZ2V0Q3VycmVuY3koeCkpIDogdGhpcy5jdXJyZW5jeUZvcm1hdDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQ3VycmVuY3lDZWxsKHZhbHVlLCBmb3JtYXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSwgY3JlYXRlQ2VsbD86ICh4OiBhbnkpID0+IElDZWxsKTogSVdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgICAgIHRoaXMuY29sdW1ucy5wdXNoKHsgbmFtZTogbmFtZSwgZXhwcmVzc2lvbjogZXhwcmVzc2lvbiwgY3JlYXRlQ2VsbDogY3JlYXRlQ2VsbCB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBzZXRDdXJyZW5jeShjdXJyZW5jeTogc3RyaW5nKTogSVdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgICAgIHRoaXMuY3VycmVuY3lGb3JtYXQgPSBFeGNlbFV0aWxzLmdldEN1cnJlbmN5Rm9ybWF0KGN1cnJlbmN5KVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHNldE5hbWUobmFtZTogc3RyaW5nKTogSVdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYnVpbGQoKTogSVdvcmtTaGVldCB7XHJcbiAgICAgICAgdmFyIHdvcmtzaGVldCA9IG5ldyBXb3JrU2hlZXQodGhpcy5uYW1lKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgY29sSWR4ID0gMDsgY29sSWR4IDwgdGhpcy5jb2x1bW5zLmxlbmd0aDsgY29sSWR4KyspIHtcclxuICAgICAgICAgICAgbGV0IGNvbHVtbiA9IHRoaXMuY29sdW1uc1tjb2xJZHhdO1xyXG4gICAgICAgICAgICB3b3Jrc2hlZXQuc2V0Q2VsbCgwLCBjb2xJZHgsIGNvbHVtbi5uYW1lKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMudmFsdWVzLmZvckVhY2goKHgsIHJvd0lkeCkgPT4ge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBjb2xJZHggPSAwOyBjb2xJZHggPCB0aGlzLmNvbHVtbnMubGVuZ3RoOyBjb2xJZHgrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbHVtbiA9IHRoaXMuY29sdW1uc1tjb2xJZHhdO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBjb2x1bW4uZXhwcmVzc2lvbih4KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNlbGwgPSBjb2x1bW4uY3JlYXRlQ2VsbCA/IGNvbHVtbi5jcmVhdGVDZWxsKHZhbHVlLCB4KSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICB3b3Jrc2hlZXQuc2V0Q2VsbChyb3dJZHggKyAxLCBjb2xJZHgsIHZhbHVlLCBjZWxsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gd29ya3NoZWV0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgbmFtZTogc3RyaW5nO1xyXG4gICAgcHJpdmF0ZSBjdXJyZW5jeUZvcm1hdDogc3RyaW5nO1xyXG4gICAgcHJpdmF0ZSBjb2x1bW5zOiB7IG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSwgY3JlYXRlQ2VsbD86ICh2YWx1ZTogYW55LCB4OiBUKSA9PiBJQ2VsbCB9W107XHJcbn0iLCJpbnRlcmZhY2UgSUV4Y2VsQ29udmVydGVyIHtcclxuICAgIGNyZWF0ZSgpOiBJV29ya0Jvb2s7XHJcbiAgICBjcmVhdGVCdWlsZGVyPFQ+KHZhbHVlczogVFtdKTogSVdvcmtTaGVldEJ1aWxkZXI8VD47XHJcbiAgICBjcmVhdGVDb21wbGV4QnVpbGRlcigpOiBJRXhjZWxCdWlsZGVyO1xyXG4gICAgc2F2ZUFzKG5hbWU6IHN0cmluZywgd29ya2Jvb2s6IElXb3JrQm9vayk7XHJcbn1cclxuXHJcbmNsYXNzIEV4Y2VsQ29udmVydGVyIGltcGxlbWVudHMgSUV4Y2VsQ29udmVydGVyIHtcclxuXHJcbiAgICBjcmVhdGUoKTogSVdvcmtCb29rIHtcclxuICAgICAgICByZXR1cm4gbmV3IFdvcmtCb29rKG51bGwpO1xyXG4gICAgfVxyXG5cclxuICAgIGNyZWF0ZUJ1aWxkZXI8VD4odmFsdWVzOiBUW10pOiBJV29ya1NoZWV0QnVpbGRlcjxUPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBXb3JrU2hlZXRCdWlsZGVyKHZhbHVlcyk7XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlQ29tcGxleEJ1aWxkZXIoKTogSUV4Y2VsQnVpbGRlciB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBFeGNlbEJ1aWxkZXIoKTtcclxuICAgIH1cclxuXHJcbiAgICBzYXZlQXMobmFtZTogc3RyaW5nLCB3b3JrYm9vazogSVdvcmtCb29rKSB7XHJcbiAgICAgICAgd29ya2Jvb2suc2F2ZUFzKG5hbWUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5Bbmd1bGFyLm1vZHVsZShcImFuZ3VsYXItZXhjZWxcIikuc2VydmljZSgnZXhjZWxDb252ZXJ0ZXInLCBFeGNlbENvbnZlcnRlcik7Il19