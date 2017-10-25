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
        this.name = name;
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
    ExcelRow.prototype.addEmpty = function () {
        return this.addString();
    };
    ExcelRow.prototype.addString = function (value) {
        return this.addCell(new StringCell(value));
    };
    ExcelRow.prototype.addNumber = function (value) {
        return this.addCell(new NumberCell(value));
    };
    ExcelRow.prototype.addCurrency = function (value, format) {
        return this.addCell(new CurrencyCell(value, format));
    };
    ExcelRow.prototype.addDate = function (isoDate) {
        return this.addCell(new DateCell(isoDate));
    };
    ExcelRow.prototype.addTime = function (isoTime, format) {
        return this.addCell(new TimeCell(isoTime, format));
    };
    ExcelRow.prototype.addCell = function (cell) {
        this.cells.push(cell);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ndWxhci1leGNlbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9hcHAudHMiLCIuLi9zcmMvdXRpbHMudHMiLCIuLi9zcmMvY2VsbEFkZHJlc3MudHMiLCIuLi9zcmMvY2VsbFJhbmdlLnRzIiwiLi4vc3JjL2NlbGwudHMiLCIuLi9zcmMvd29ya3NoZWV0LnRzIiwiLi4vc3JjL3dvcmtib29rLnRzIiwiLi4vc3JjL2V4Y2VsQnVpbGRlci50cyIsIi4uL3NyYy93b3Jrc2hlZXRCdWlsZGVyLnRzIiwiLi4vc3JjL2V4Y2VsQ29udmVydGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxJQUFVLEtBQUssQ0FzQmQ7QUF0QkQsV0FBVSxLQUFLO0lBT1g7UUFHSSxrQkFBWSxNQUFXLEVBQUUsSUFBUyxFQUFFLFFBQWEsRUFBRSxVQUFlO1lBQzlELFVBQVUsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDN0QsQ0FBQztRQUpNLGdCQUFPLEdBQUcsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUtsRSxlQUFDO0tBQUEsQUFORCxJQU1DO0lBRUQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsRUFBRSxDQUFDO1NBQzlCLFFBQVEsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDO1NBQzFCLFFBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDO1NBQ3RCLFFBQVEsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDO1NBQzFCLFFBQVEsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDO1NBQzlCLFFBQVEsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDO1NBQ2xDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN2QixDQUFDLEVBdEJTLEtBQUssS0FBTCxLQUFLLFFBc0JkO0FDdEJEO0lBQUE7SUFpRUEsQ0FBQztJ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QU0sQ0FBQyxDQUFDO2dCQUNsQyxJQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuQyxJQUFNLElBQUksR0FBRyxNQUFNLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDcEUsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdkQsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLFNBQVMsQ0FBQztJQUNyQixDQUFDO0lBS0wsdUJBQUM7QUFBRCxDQUFDLEFBeEVELElBd0VDO0FDNUVEO0lBQUE7SUFpQkEsQ0FBQztJQWZHLCtCQUFNLEdBQU47UUFDSSxNQUFNLENBQUMsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUVELHNDQUFhLEdBQWIsVUFBaUIsTUFBVztRQUN4QixNQUFNLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRUQsNkNBQW9CLEdBQXBCO1FBQ0ksTUFBTSxDQUFDLElBQUksWUFBWSxFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUVELCtCQUFNLEdBQU4sVUFBTyxJQUFZLEVBQUUsUUFBbUI7UUFDcEMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBQ0wscUJBQUM7QUFBRCxDQUFDLEFBakJELElBaUJDO0FBRUQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJuYW1lc3BhY2UgZXhjZWwge1xyXG4gICAgZGVjbGFyZSB2YXIgWExTWDogYW55O1xyXG4gICAgZGVjbGFyZSB2YXIgc2F2ZUFzOiBhbnk7XHJcbiAgICBkZWNsYXJlIHZhciBtb21lbnQ6IGFueTtcclxuICAgIGRlY2xhcmUgdmFyIGN1cnJlbmN5OiBhbnk7XHJcbiAgICBkZWNsYXJlIHZhciBhY2NvdW50aW5nOiBhbnk7XHJcblxyXG4gICAgY2xhc3MgRXhjZWxSdW4ge1xyXG4gICAgICAgIHN0YXRpYyAkaW5qZWN0ID0gW1wic2F2ZUFzXCIsIFwiWExTWFwiLCBcImN1cnJlbmN5XCIsIFwiYWNjb3VudGluZ1wiXTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3Ioc2F2ZUFzOiBhbnksIHhsc3g6IGFueSwgY3VycmVuY3k6IGFueSwgYWNjb3VudGluZzogYW55KSB7XHJcbiAgICAgICAgICAgIEV4Y2VsVXRpbHMuYm9vdHN0cmFwKHNhdmVBcywgeGxzeCwgY3VycmVuY3ksIGFjY291bnRpbmcpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBBbmd1bGFyLm1vZHVsZShcImFuZ3VsYXItZXhjZWxcIiwgW10pXHJcbiAgICAgICAgLmNvbnN0YW50KFwic2F2ZUFzXCIsIHNhdmVBcylcclxuICAgICAgICAuY29uc3RhbnQoXCJYTFNYXCIsIFhMU1gpXHJcbiAgICAgICAgLmNvbnN0YW50KFwibW9tZW50XCIsIG1vbWVudClcclxuICAgICAgICAuY29uc3RhbnQoXCJjdXJyZW5jeVwiLCBjdXJyZW5jeSlcclxuICAgICAgICAuY29uc3RhbnQoXCJhY2NvdW50aW5nXCIsIGFjY291bnRpbmcpXHJcbiAgICAgICAgLnJ1bihFeGNlbFJ1bik7XHJcbn0iLCJjbGFzcyBFeGNlbFV0aWxzIHtcclxuICAgIHByaXZhdGUgc3RhdGljIHNhdmVBczogYW55O1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgeGxzeDogYW55O1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgY3VycmVuY3k6IGFueTtcclxuICAgIHByaXZhdGUgc3RhdGljIGFjY291bnRpbmc6IGFueTtcclxuXHJcbiAgICBzdGF0aWMgYm9vdHN0cmFwKHNhdmVBczogYW55LCB4bHN4LCBjdXJyZW5jeTogYW55LCBhY2NvdW50aW5nOiBhbnkpIHtcclxuICAgICAgICBFeGNlbFV0aWxzLnNhdmVBcyA9IHNhdmVBcztcclxuICAgICAgICBFeGNlbFV0aWxzLnhsc3ggPSB4bHN4O1xyXG4gICAgICAgIEV4Y2VsVXRpbHMuY3VycmVuY3kgPSBjdXJyZW5jeTtcclxuICAgICAgICBFeGNlbFV0aWxzLmFjY291bnRpbmcgPSBhY2NvdW50aW5nO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZW5jb2RlQ2VsbChhZGRyZXNzOiBJQ2VsbEFkZHJlc3MpIHtcclxuICAgICAgICByZXR1cm4gRXhjZWxVdGlscy54bHN4LnV0aWxzLmVuY29kZV9jZWxsKGFkZHJlc3MpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZW5jb2RlUmFuZ2UocmFuZ2U6IElDZWxsUmFuZ2UpIHtcclxuICAgICAgICByZXR1cm4gRXhjZWxVdGlscy54bHN4LnV0aWxzLmVuY29kZV9yYW5nZShyYW5nZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBnZXRDdXJyZW5jeUZvcm1hdChjdXJyZW5jeTogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgICAgICBjb25zdCBjdXJyZW5jeVN5bWJvbCA9IEV4Y2VsVXRpbHMuY3VycmVuY3kuc3ltYm9saXplKGN1cnJlbmN5KTtcclxuICAgICAgICBjb25zdCBjdXJyZW5jeVNldHRpbmdzID0gRXhjZWxVdGlscy5hY2NvdW50aW5nLnNldHRpbmdzLmN1cnJlbmN5O1xyXG4gICAgICAgIHZhciBjdXJyZW5jeUZvcm1hdCA9IGAke2N1cnJlbmN5U3ltYm9sfSMke2N1cnJlbmN5U2V0dGluZ3MudGhvdXNhbmR9IyMwJHtjdXJyZW5jeVNldHRpbmdzLmRlY2ltYWx9MDBgO1xyXG4gICAgICAgIHJldHVybiBjdXJyZW5jeUZvcm1hdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGZvcm1hdFRpbWUoaXNvVGltZTogc3RyaW5nKTogbnVtYmVyIHtcclxuICAgICAgICBpZiAoaXNvVGltZSA9PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGNvbnN0IFNFQ09ORFNfSU5fREFZID0gODY0MDA7XHJcbiAgICAgICAgY29uc3QgU0VDT05EU19JTl9IT1VSID0gMzYwMDtcclxuICAgICAgICBjb25zdCBTRUNPTkRTX0lOX01JTlVURSA9IDYwO1xyXG5cclxuICAgICAgICBjb25zdCB2YWx1ZXMgPSBpc29UaW1lLnNwbGl0KFwiOlwiKTtcclxuICAgICAgICBjb25zdCBob3VyU2Vjb25kcyA9IE51bWJlcih2YWx1ZXNbMF0pICogU0VDT05EU19JTl9IT1VSO1xyXG4gICAgICAgIGNvbnN0IG1pbnV0ZVNlY29uZHMgPSBOdW1iZXIodmFsdWVzWzFdKSAqIFNFQ09ORFNfSU5fTUlOVVRFO1xyXG4gICAgICAgIGNvbnN0IHNlY29uZHMgPSBOdW1iZXIodmFsdWVzWzJdKTtcclxuICAgICAgICBjb25zdCB0b3RhbFNlY29uZHMgPSBob3VyU2Vjb25kcyArIG1pbnV0ZVNlY29uZHMgKyBzZWNvbmRzO1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gdG90YWxTZWNvbmRzIC8gU0VDT05EU19JTl9EQVk7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgY29udmVydFRvQmluYXJ5KHdvcmtib29rOiBzdHJpbmcpOiBBcnJheUJ1ZmZlciB7XHJcbiAgICAgICAgdmFyIGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcih3b3JrYm9vay5sZW5ndGgpO1xyXG4gICAgICAgIHZhciB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSAhPT0gd29ya2Jvb2subGVuZ3RoOyArK2kpXHJcbiAgICAgICAgICAgIHZpZXdbaV0gPSB3b3JrYm9vay5jaGFyQ29kZUF0KGkpICYgMHhGRjtcclxuICAgICAgICByZXR1cm4gYnVmZmVyO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgd3JpdGVXb3JrYm9vayh3b3JrYm9vazogSVdvcmtCb29rLCBvcHRpb25zPzogYW55LCBlbmFibGVMZWdhY3lTYWZhcmlTdXBwb3J0ID0gdHJ1ZSk6IHN0cmluZyB7XHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge1xyXG4gICAgICAgICAgICBib29rVHlwZTogJ3hsc3gnLCBcclxuICAgICAgICAgICAgdHlwZTogJ2JpbmFyeSdcclxuICAgICAgICB9O1xyXG4gICAgICAgIG9wdGlvbnMuYm9va1NTVCA9IGVuYWJsZUxlZ2FjeVNhZmFyaVN1cHBvcnQ7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMueGxzeC53cml0ZSh3b3JrYm9vaywgb3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBzYXZlQnVmZmVyKG5hbWU6IHN0cmluZywgYnVmZmVyOiBBcnJheUJ1ZmZlcikge1xyXG4gICAgICAgIEV4Y2VsVXRpbHMuc2F2ZUFzKG5ldyBCbG9iKFtidWZmZXJdLCB7IHR5cGU6IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCIgfSksIGAke25hbWV9Lnhsc3hgKTtcclxuICAgIH1cclxufSIsImludGVyZmFjZSBJQ2VsbEFkZHJlc3Mge1xyXG4gICAgYzogbnVtYmVyO1xyXG4gICAgcjogbnVtYmVyO1xyXG59XHJcblxyXG5jbGFzcyBDZWxsQWRkcmVzcyBpbXBsZW1lbnRzIElDZWxsQWRkcmVzcyB7XHJcbiAgICBjb25zdHJ1Y3Rvcihyb3c6IG51bWJlciwgY29sOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLnIgPSByb3c7XHJcbiAgICAgICAgdGhpcy5jID0gY29sO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIDAtaW5kZXhlZCBjb2x1bW5cclxuICAgIGM6IG51bWJlcjtcclxuICAgIC8vIDAtaW5kZXhlZCByb3dcclxuICAgIHI6IG51bWJlcjtcclxufSIsImludGVyZmFjZSBJQ2VsbFJhbmdlIHtcclxuICAgIGFkZEFkZHJlc3MoYWRkcmVzczogSUNlbGxBZGRyZXNzKTtcclxufVxyXG5cclxuY2xhc3MgQ2VsbFJhbmdlIGltcGxlbWVudHMgSUNlbGxSYW5nZSB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLnMgPSBuZXcgQ2VsbEFkZHJlc3MoMCwgMCk7XHJcbiAgICAgICAgdGhpcy5lID0gbmV3IENlbGxBZGRyZXNzKDAsIDApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHN0YXJ0XHJcbiAgICBzOiBDZWxsQWRkcmVzcztcclxuICAgIC8vIGVuZFxyXG4gICAgZTogQ2VsbEFkZHJlc3M7XHJcblxyXG4gICAgYWRkQWRkcmVzcyhhZGRyZXNzOiBJQ2VsbEFkZHJlc3MpIHtcclxuICAgICAgICBpZiAoYWRkcmVzcy5yIDwgdGhpcy5zLnIpXHJcbiAgICAgICAgICAgIHRoaXMucy5yID0gYWRkcmVzcy5yO1xyXG4gICAgICAgIGlmIChhZGRyZXNzLmMgPCB0aGlzLnMuYylcclxuICAgICAgICAgICAgdGhpcy5zLmMgPSBhZGRyZXNzLmM7XHJcblxyXG4gICAgICAgIGlmIChhZGRyZXNzLnIgPiB0aGlzLmUucilcclxuICAgICAgICAgICAgdGhpcy5lLnIgPSBhZGRyZXNzLnI7XHJcbiAgICAgICAgaWYgKGFkZHJlc3MuYyA+IHRoaXMuZS5jKVxyXG4gICAgICAgICAgICB0aGlzLmUuYyA9IGFkZHJlc3MuYztcclxuICAgIH1cclxufSIsIi8vIHNlZTogaHR0cHM6Ly9naXRodWIuY29tL1NoZWV0SlMvanMteGxzeCNjZWxsLW9iamVjdFxyXG5cclxuaW50ZXJmYWNlIElDZWxsIHtcclxuICAgIHY6IHN0cmluZztcclxuICAgIHc6IHN0cmluZztcclxuICAgIHQ6IHN0cmluZztcclxuICAgIGY6IHN0cmluZztcclxuICAgIEY6IHN0cmluZztcclxuICAgIHI6IHN0cmluZztcclxuICAgIGg6IHN0cmluZztcclxuICAgIGM6IHN0cmluZztcclxuICAgIHo6IHN0cmluZztcclxuICAgIGw6IHN0cmluZztcclxuICAgIHM6IHN0cmluZztcclxufVxyXG5cclxuY2xhc3MgQ2VsbCBpbXBsZW1lbnRzIElDZWxsIHtcclxuICAgIHByb3RlY3RlZCBzZXRWYWx1ZSh2YWx1ZTogYW55LCB0eXBlOiBzdHJpbmcsIGZvcm1hdD86IHN0cmluZykge1xyXG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgdGhpcy52ID0gdmFsdWUudG9TdHJpbmcoKTtcclxuICAgICAgICB0aGlzLnQgPSB0eXBlO1xyXG4gICAgICAgIHRoaXMueiA9IGZvcm1hdDtcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgc2V0Rm9ybWF0KGZvcm1hdD86IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMueiA9IGZvcm1hdDtcclxuICAgIH1cclxuXHJcbiAgICB2OiBzdHJpbmc7XHJcbiAgICB3OiBzdHJpbmc7XHJcbiAgICB0OiBzdHJpbmc7XHJcbiAgICBmOiBzdHJpbmc7XHJcbiAgICBGOiBzdHJpbmc7XHJcbiAgICByOiBzdHJpbmc7XHJcbiAgICBoOiBzdHJpbmc7XHJcbiAgICBjOiBzdHJpbmc7XHJcbiAgICB6OiBzdHJpbmc7XHJcbiAgICBsOiBzdHJpbmc7XHJcbiAgICBzOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNsYXNzIERhdGVDZWxsIGV4dGVuZHMgQ2VsbCB7XHJcbiAgICBjb25zdHJ1Y3Rvcihpc29EYXRlOiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuc2V0VmFsdWUoaXNvRGF0ZSwgJ2QnKTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgQ3VycmVuY3lDZWxsIGV4dGVuZHMgQ2VsbCB7XHJcbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZTogbnVtYmVyLCBmb3JtYXQ6IHN0cmluZyA9IFwiJCMsIyMwLjAwXCIpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuc2V0VmFsdWUodmFsdWUsICduJywgZm9ybWF0KTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRGb3JtYXQoZm9ybWF0OiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlci5zZXRGb3JtYXQoZm9ybWF0KTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgVGltZUNlbGwgZXh0ZW5kcyBDZWxsIHtcclxuICAgIGNvbnN0cnVjdG9yKGlzb1RpbWU6IHN0cmluZywgZm9ybWF0OiBzdHJpbmcgPSBcImg6bW0gQU0vUE1cIikge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBFeGNlbFV0aWxzLmZvcm1hdFRpbWUoaXNvVGltZSk7XHJcbiAgICAgICAgdGhpcy5zZXRWYWx1ZSh2YWx1ZSwgJ24nLCBmb3JtYXQpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBOdW1iZXJDZWxsIGV4dGVuZHMgQ2VsbCB7XHJcbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZT86IGFueSkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5zZXRWYWx1ZSh2YWx1ZSwgJ24nKTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgU3RyaW5nQ2VsbCBleHRlbmRzIENlbGwge1xyXG4gICAgY29uc3RydWN0b3IodmFsdWU/OiBhbnkpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuc2V0VmFsdWUodmFsdWUsICdzJyk7XHJcbiAgICB9XHJcbn0iLCJpbnRlcmZhY2UgSVdvcmtTaGVldCB7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICBzZXRDZWxsKHJvdzogbnVtYmVyLCBjb2w6IG51bWJlciwgdmFsdWU6IGFueSwgY2VsbD86IElDZWxsKTtcclxuICAgIGdldENlbGwocm93OiBudW1iZXIsIGNvbDogbnVtYmVyKTogSUNlbGw7XHJcbn1cclxuXHJcbmNsYXNzIFdvcmtTaGVldCBpbXBsZW1lbnRzIElXb3JrU2hlZXQge1xyXG4gICAgY29uc3RydWN0b3IocHVibGljIG5hbWUpIHtcclxuICAgICAgICB0aGlzLl9yYW5nZSA9IG5ldyBDZWxsUmFuZ2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9yYW5nZTogSUNlbGxSYW5nZTtcclxuXHJcbiAgICBzZXRDZWxsKHJvdzogbnVtYmVyLCBjb2w6IG51bWJlciwgdmFsdWU6IGFueSwgY2VsbD86IElDZWxsKSB7XHJcbiAgICAgICAgdmFyIGFkZHJlc3MgPSBuZXcgQ2VsbEFkZHJlc3Mocm93LCBjb2wpO1xyXG4gICAgICAgIGlmICghY2VsbClcclxuICAgICAgICAgICAgY2VsbCA9IG5ldyBTdHJpbmdDZWxsKHZhbHVlKTtcclxuXHJcbiAgICAgICAgdmFyIGNlbGxSZWZlcmVuY2UgPSBFeGNlbFV0aWxzLmVuY29kZUNlbGwoYWRkcmVzcyk7XHJcbiAgICAgICAgdGhpc1tjZWxsUmVmZXJlbmNlXSA9IGNlbGw7XHJcblxyXG4gICAgICAgIHRoaXMuX3JhbmdlLmFkZEFkZHJlc3MoYWRkcmVzcyk7XHJcbiAgICAgICAgdGhpc1tcIiFyZWZcIl0gPSBFeGNlbFV0aWxzLmVuY29kZVJhbmdlKHRoaXMuX3JhbmdlKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRDZWxsKHJvdzogbnVtYmVyLCBjb2w6IG51bWJlcik6IElDZWxsIHtcclxuICAgICAgICB2YXIgYWRkcmVzcyA9IG5ldyBDZWxsQWRkcmVzcyhyb3csIGNvbCk7XHJcbiAgICAgICAgdmFyIGNlbGxSZWZlcmVuY2UgPSBFeGNlbFV0aWxzLmVuY29kZUNlbGwoYWRkcmVzcyk7XHJcbiAgICAgICAgdmFyIGNlbGwgPSB0aGlzW2NlbGxSZWZlcmVuY2VdO1xyXG4gICAgICAgIHJldHVybiBjZWxsO1xyXG4gICAgfVxyXG59IiwiaW50ZXJmYWNlIElXb3JrQm9vayB7XHJcbiAgICBhZGRXb3JrU2hlZXQod3M6IHN0cmluZyB8IElXb3JrU2hlZXQpOiBJV29ya1NoZWV0O1xyXG4gICAgc2F2ZSgpO1xyXG4gICAgc2F2ZUFzKG5hbWU6IHN0cmluZyk7XHJcbn1cclxuXHJcbmNsYXNzIFdvcmtCb29rIGltcGxlbWVudHMgSVdvcmtCb29rIHtcclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBuYW1lOiBzdHJpbmcgPSBcIldvcmtib29rXCIpIHtcclxuICAgICAgICB0aGlzWydTaGVldE5hbWVzJ10gPSBbXTtcclxuICAgICAgICB0aGlzWydTaGVldHMnXSA9IHt9O1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFdvcmtTaGVldCh3b3Jrc2hlZXQ6IHN0cmluZyB8IElXb3JrU2hlZXQpOiBJV29ya1NoZWV0IHtcclxuICAgICAgICBpZiAodHlwZW9mIHdvcmtzaGVldCA9PSBcInN0cmluZ1wiKVxyXG4gICAgICAgICAgICB3b3Jrc2hlZXQgPSBuZXcgV29ya1NoZWV0KHdvcmtzaGVldCk7XHJcblxyXG4gICAgICAgIGNvbnN0IG5hbWUgPSB3b3Jrc2hlZXQubmFtZTtcclxuICAgICAgICBsZXQgc2hlZXROYW1lczogc3RyaW5nW10gPSB0aGlzWydTaGVldE5hbWVzJ107XHJcbiAgICAgICAgc2hlZXROYW1lcy5wdXNoKG5hbWUpO1xyXG4gICAgICAgIHRoaXNbJ1NoZWV0cyddW25hbWVdID0gd29ya3NoZWV0O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB3b3Jrc2hlZXQ7XHJcbiAgICB9XHJcblxyXG4gICAgc2F2ZSgpIHtcclxuICAgICAgICB0aGlzLnNhdmVBcyh0aGlzLm5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHNhdmVBcyhuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCB3Ym91dCA9IEV4Y2VsVXRpbHMud3JpdGVXb3JrYm9vayh0aGlzKTtcclxuICAgICAgICB2YXIgYnVmZmVyID0gRXhjZWxVdGlscy5jb252ZXJ0VG9CaW5hcnkod2JvdXQpO1xyXG4gICAgICAgIEV4Y2VsVXRpbHMuc2F2ZUJ1ZmZlcihuYW1lLCBidWZmZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3NoZWV0TmFtZXM6IHN0cmluZ1tdO1xyXG4gICAgcHJpdmF0ZSBfc2hlZXRzOiBzdHJpbmdbXVtdO1xyXG59IiwiaW50ZXJmYWNlIElFeGNlbEJ1aWxkZXIge1xyXG4gICAgc2V0Q3VycmVuY3koY3VycmVuY3k6IHN0cmluZyk6IElFeGNlbEJ1aWxkZXI7XHJcbiAgICBzZXROYW1lKG5hbWU6IHN0cmluZyk6IElFeGNlbEJ1aWxkZXJcclxuICAgIGJ1aWxkKCk6IElXb3JrU2hlZXQ7XHJcbn1cclxuXHJcbmNsYXNzIEV4Y2VsQnVpbGRlciBpbXBsZW1lbnRzIElFeGNlbEJ1aWxkZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5yb3dzID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Q3VycmVuY3koY3VycmVuY3k6IHN0cmluZyk6IElFeGNlbEJ1aWxkZXIge1xyXG4gICAgICAgIHRoaXMuY3VycmVuY3lGb3JtYXQgPSBFeGNlbFV0aWxzLmdldEN1cnJlbmN5Rm9ybWF0KGN1cnJlbmN5KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBzZXROYW1lKG5hbWU6IHN0cmluZyk6IElFeGNlbEJ1aWxkZXIge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkUm93KHJvdzogSUV4Y2VsUm93KTogSUV4Y2VsQnVpbGRlciB7XHJcbiAgICAgICAgdGhpcy5yb3dzLnB1c2gocm93KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBidWlsZCgpOiBJV29ya1NoZWV0IHtcclxuICAgICAgICB2YXIgd29ya3NoZWV0ID0gbmV3IFdvcmtTaGVldCh0aGlzLm5hbWUpO1xyXG5cclxuICAgICAgICB0aGlzLnJvd3MuZm9yRWFjaCgocm93LCByb3dJZHgpID0+IHtcclxuICAgICAgICAgICAgcm93LmNlbGxzLmZvckVhY2goKGNlbGwsIGNlbGxJZHgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmKGNlbGwgaW5zdGFuY2VvZiBDdXJyZW5jeUNlbGwpXHJcbiAgICAgICAgICAgICAgICAgICAgY2VsbC5zZXRGb3JtYXQodGhpcy5jdXJyZW5jeUZvcm1hdCk7XHJcbiAgICAgICAgICAgICAgICB3b3Jrc2hlZXQuc2V0Q2VsbChyb3dJZHgsIGNlbGxJZHgsIG51bGwsIGNlbGwpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHdvcmtzaGVldDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGN1cnJlbmN5Rm9ybWF0OiBzdHJpbmc7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICBwcml2YXRlIHJvd3M6IElFeGNlbFJvd1tdO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUV4Y2VsUm93IHtcclxuICAgIGFkZEVtcHR5KCk6IElFeGNlbFJvdztcclxuICAgIGFkZFN0cmluZyh2YWx1ZT86IHN0cmluZyk6IElFeGNlbFJvdztcclxuICAgIGFkZE51bWJlcih2YWx1ZT86IGFueSk6IElFeGNlbFJvdztcclxuICAgIGFkZEN1cnJlbmN5KHZhbHVlPzogbnVtYmVyKTogSUV4Y2VsUm93O1xyXG4gICAgYWRkRGF0ZShpc29EYXRlPzogc3RyaW5nKTogSUV4Y2VsUm93O1xyXG4gICAgYWRkVGltZShpc29UaW1lPzogc3RyaW5nKTogSUV4Y2VsUm93O1xyXG4gICAgYWRkQ2VsbChjZWxsOiBJQ2VsbCk6IElFeGNlbFJvdztcclxuICAgIGNlbGxzOiBJQ2VsbFtdO1xyXG59XHJcblxyXG5jbGFzcyBFeGNlbFJvdyBpbXBsZW1lbnRzIElFeGNlbFJvdyB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmNlbGxzID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgYWRkRW1wdHkoKTogSUV4Y2VsUm93IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hZGRTdHJpbmcoKTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRTdHJpbmcodmFsdWU/OiBzdHJpbmcpOiBJRXhjZWxSb3cge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmFkZENlbGwobmV3IFN0cmluZ0NlbGwodmFsdWUpKTtcclxuICAgIH1cclxuXHJcbiAgICBhZGROdW1iZXIodmFsdWU/OiBhbnkpOiBJRXhjZWxSb3cge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmFkZENlbGwobmV3IE51bWJlckNlbGwodmFsdWUpKTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRDdXJyZW5jeSh2YWx1ZT86IG51bWJlciwgZm9ybWF0Pzogc3RyaW5nKTogSUV4Y2VsUm93IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hZGRDZWxsKG5ldyBDdXJyZW5jeUNlbGwodmFsdWUsIGZvcm1hdCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZERhdGUoaXNvRGF0ZT86IHN0cmluZyk6IElFeGNlbFJvdyB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkQ2VsbChuZXcgRGF0ZUNlbGwoaXNvRGF0ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFRpbWUoaXNvVGltZT86IHN0cmluZywgZm9ybWF0Pzogc3RyaW5nKTogSUV4Y2VsUm93IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hZGRDZWxsKG5ldyBUaW1lQ2VsbChpc29UaW1lLCBmb3JtYXQpKTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRDZWxsKGNlbGw6IElDZWxsKTogSUV4Y2VsUm93IHtcclxuICAgICAgICB0aGlzLmNlbGxzLnB1c2goY2VsbCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNlbGxzOiBJQ2VsbFtdO1xyXG59IiwiaW50ZXJmYWNlIElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgIGFkZFRpbWVDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55LCBmb3JtYXQ/OiBzdHJpbmcpOiBJV29ya1NoZWV0QnVpbGRlcjxUPlxyXG4gICAgYWRkRGF0ZUNvbHVtbihuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246ICh4OiBUKSA9PiBhbnkpOiBJV29ya1NoZWV0QnVpbGRlcjxUPjtcclxuICAgIGFkZE51bWJlckNvbHVtbihuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246ICh4OiBUKSA9PiBhbnkpOiBJV29ya1NoZWV0QnVpbGRlcjxUPlxyXG4gICAgYWRkQ3VycmVuY3lDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55LCBnZXRDdXJyZW5jeT86ICh4OiBUKSA9PiBzdHJpbmcpOiBJV29ya1NoZWV0QnVpbGRlcjxUPlxyXG4gICAgYWRkQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSwgY3JlYXRlQ2VsbD86ICh4OiBhbnkpID0+IElDZWxsKTogSVdvcmtTaGVldEJ1aWxkZXI8VD47XHJcbiAgICBzZXROYW1lKG5hbWU6IHN0cmluZyk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+O1xyXG4gICAgc2V0Q3VycmVuY3koY3VycmVuY3lGb3JtYXQ6IHN0cmluZyk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+O1xyXG4gICAgYnVpbGQoKTogSVdvcmtTaGVldDtcclxufVxyXG5cclxuY2xhc3MgV29ya1NoZWV0QnVpbGRlcjxUPiBpbXBsZW1lbnRzIElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdmFsdWVzOiBUW10pIHtcclxuICAgICAgICB0aGlzLmNvbHVtbnMgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRUaW1lQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSwgZm9ybWF0Pzogc3RyaW5nKTogSVdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgICAgIHRoaXMuY29sdW1ucy5wdXNoKHsgbmFtZTogbmFtZSwgZXhwcmVzc2lvbjogZXhwcmVzc2lvbiwgY3JlYXRlQ2VsbDogeCA9PiBuZXcgVGltZUNlbGwoeCwgZm9ybWF0KSB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBhZGREYXRlQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgICAgICB0aGlzLmNvbHVtbnMucHVzaCh7XHJcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXHJcbiAgICAgICAgICAgIGV4cHJlc3Npb246IGV4cHJlc3Npb24sXHJcbiAgICAgICAgICAgIGNyZWF0ZUNlbGw6IHggPT4gbmV3IERhdGVDZWxsKHgpXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkTnVtYmVyQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgICAgICB0aGlzLmNvbHVtbnMucHVzaCh7IG5hbWU6IG5hbWUsIGV4cHJlc3Npb246IGV4cHJlc3Npb24sIGNyZWF0ZUNlbGw6IHggPT4gbmV3IE51bWJlckNlbGwoeCkgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkQ3VycmVuY3lDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55LCBnZXRDdXJyZW5jeT86ICh4OiBUKSA9PiBzdHJpbmcpOiBJV29ya1NoZWV0QnVpbGRlcjxUPiB7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5zLnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiBuYW1lLCBleHByZXNzaW9uOiBleHByZXNzaW9uLCBjcmVhdGVDZWxsOiAodmFsdWUsIHgpID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBmb3JtYXQgPSBnZXRDdXJyZW5jeSA/IEV4Y2VsVXRpbHMuZ2V0Q3VycmVuY3lGb3JtYXQoZ2V0Q3VycmVuY3koeCkpIDogdGhpcy5jdXJyZW5jeUZvcm1hdDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQ3VycmVuY3lDZWxsKHZhbHVlLCBmb3JtYXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSwgY3JlYXRlQ2VsbD86ICh4OiBhbnkpID0+IElDZWxsKTogSVdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgICAgIHRoaXMuY29sdW1ucy5wdXNoKHsgbmFtZTogbmFtZSwgZXhwcmVzc2lvbjogZXhwcmVzc2lvbiwgY3JlYXRlQ2VsbDogY3JlYXRlQ2VsbCB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBzZXRDdXJyZW5jeShjdXJyZW5jeTogc3RyaW5nKTogSVdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgICAgIHRoaXMuY3VycmVuY3lGb3JtYXQgPSBFeGNlbFV0aWxzLmdldEN1cnJlbmN5Rm9ybWF0KGN1cnJlbmN5KVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHNldE5hbWUobmFtZTogc3RyaW5nKTogSVdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYnVpbGQoKTogSVdvcmtTaGVldCB7XHJcbiAgICAgICAgdmFyIHdvcmtzaGVldCA9IG5ldyBXb3JrU2hlZXQodGhpcy5uYW1lKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgY29sSWR4ID0gMDsgY29sSWR4IDwgdGhpcy5jb2x1bW5zLmxlbmd0aDsgY29sSWR4KyspIHtcclxuICAgICAgICAgICAgbGV0IGNvbHVtbiA9IHRoaXMuY29sdW1uc1tjb2xJZHhdO1xyXG4gICAgICAgICAgICB3b3Jrc2hlZXQuc2V0Q2VsbCgwLCBjb2xJZHgsIGNvbHVtbi5uYW1lKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMudmFsdWVzLmZvckVhY2goKHgsIHJvd0lkeCkgPT4ge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBjb2xJZHggPSAwOyBjb2xJZHggPCB0aGlzLmNvbHVtbnMubGVuZ3RoOyBjb2xJZHgrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbHVtbiA9IHRoaXMuY29sdW1uc1tjb2xJZHhdO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBjb2x1bW4uZXhwcmVzc2lvbih4KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNlbGwgPSBjb2x1bW4uY3JlYXRlQ2VsbCA/IGNvbHVtbi5jcmVhdGVDZWxsKHZhbHVlLCB4KSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICB3b3Jrc2hlZXQuc2V0Q2VsbChyb3dJZHggKyAxLCBjb2xJZHgsIHZhbHVlLCBjZWxsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gd29ya3NoZWV0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgbmFtZTogc3RyaW5nO1xyXG4gICAgcHJpdmF0ZSBjdXJyZW5jeUZvcm1hdDogc3RyaW5nO1xyXG4gICAgcHJpdmF0ZSBjb2x1bW5zOiB7IG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSwgY3JlYXRlQ2VsbD86ICh2YWx1ZTogYW55LCB4OiBUKSA9PiBJQ2VsbCB9W107XHJcbn0iLCJpbnRlcmZhY2UgSUV4Y2VsQ29udmVydGVyIHtcclxuICAgIGNyZWF0ZSgpOiBJV29ya0Jvb2s7XHJcbiAgICBjcmVhdGVCdWlsZGVyPFQ+KHZhbHVlczogVFtdKTogSVdvcmtTaGVldEJ1aWxkZXI8VD47XHJcbiAgICBjcmVhdGVDb21wbGV4QnVpbGRlcigpOiBJRXhjZWxCdWlsZGVyO1xyXG4gICAgc2F2ZUFzKG5hbWU6IHN0cmluZywgd29ya2Jvb2s6IElXb3JrQm9vayk7XHJcbn1cclxuXHJcbmNsYXNzIEV4Y2VsQ29udmVydGVyIGltcGxlbWVudHMgSUV4Y2VsQ29udmVydGVyIHtcclxuXHJcbiAgICBjcmVhdGUoKTogSVdvcmtCb29rIHtcclxuICAgICAgICByZXR1cm4gbmV3IFdvcmtCb29rKG51bGwpO1xyXG4gICAgfVxyXG5cclxuICAgIGNyZWF0ZUJ1aWxkZXI8VD4odmFsdWVzOiBUW10pOiBJV29ya1NoZWV0QnVpbGRlcjxUPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBXb3JrU2hlZXRCdWlsZGVyKHZhbHVlcyk7XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlQ29tcGxleEJ1aWxkZXIoKTogSUV4Y2VsQnVpbGRlciB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBFeGNlbEJ1aWxkZXIoKTtcclxuICAgIH1cclxuXHJcbiAgICBzYXZlQXMobmFtZTogc3RyaW5nLCB3b3JrYm9vazogSVdvcmtCb29rKSB7XHJcbiAgICAgICAgd29ya2Jvb2suc2F2ZUFzKG5hbWUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5Bbmd1bGFyLm1vZHVsZShcImFuZ3VsYXItZXhjZWxcIikuc2VydmljZSgnZXhjZWxDb252ZXJ0ZXInLCBFeGNlbENvbnZlcnRlcik7Il19