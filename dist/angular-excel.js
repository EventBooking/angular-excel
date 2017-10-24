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
    function ExcelRow(currencyFormat) {
        this.currencyFormat = currencyFormat;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ndWxhci1leGNlbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9hcHAudHMiLCIuLi9zcmMvdXRpbHMudHMiLCIuLi9zcmMvY2VsbEFkZHJlc3MudHMiLCIuLi9zcmMvY2VsbFJhbmdlLnRzIiwiLi4vc3JjL2NlbGwudHMiLCIuLi9zcmMvd29ya3NoZWV0LnRzIiwiLi4vc3JjL3dvcmtib29rLnRzIiwiLi4vc3JjL2V4Y2VsQnVpbGRlci50cyIsIi4uL3NyYy93b3Jrc2hlZXRCdWlsZGVyLnRzIiwiLi4vc3JjL2V4Y2VsQ29udmVydGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxJQUFVLEtBQUssQ0FzQmQ7QUF0QkQsV0FBVSxLQUFLO0lBT1g7UUFHSSxrQkFBWSxNQUFXLEVBQUUsSUFBUyxFQUFFLFFBQWEsRUFBRSxVQUFlO1lBQzlELFVBQVUsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDN0QsQ0FBQztRQUpNLGdCQUFPLEdBQUcsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUtsRSxlQUFDO0tBQUEsQUFORCxJQU1DO0lBRUQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsRUFBRSxDQUFDO1NBQzlCLFFBQVEsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDO1NBQzFCLFFBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDO1NBQ3RCLFFBQVEsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDO1NBQzFCLFFBQVEsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDO1NBQzlCLFFBQVEsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDO1NBQ2xDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN2QixDQUFDLEVBdEJTLEtBQUssS0FBTCxLQUFLLFFBc0JkO0FDdEJEO0lBQUE7SUFpRUEsQ0FBQztJ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XHJcbiAgICBkZWNsYXJlIHZhciBzYXZlQXM6IGFueTtcclxuICAgIGRlY2xhcmUgdmFyIG1vbWVudDogYW55O1xyXG4gICAgZGVjbGFyZSB2YXIgY3VycmVuY3k6IGFueTtcclxuICAgIGRlY2xhcmUgdmFyIGFjY291bnRpbmc6IGFueTtcclxuXHJcbiAgICBjbGFzcyBFeGNlbFJ1biB7XHJcbiAgICAgICAgc3RhdGljICRpbmplY3QgPSBbXCJzYXZlQXNcIiwgXCJYTFNYXCIsIFwiY3VycmVuY3lcIiwgXCJhY2NvdW50aW5nXCJdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihzYXZlQXM6IGFueSwgeGxzeDogYW55LCBjdXJyZW5jeTogYW55LCBhY2NvdW50aW5nOiBhbnkpIHtcclxuICAgICAgICAgICAgRXhjZWxVdGlscy5ib290c3RyYXAoc2F2ZUFzLCB4bHN4LCBjdXJyZW5jeSwgYWNjb3VudGluZyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIEFuZ3VsYXIubW9kdWxlKFwiYW5ndWxhci1leGNlbFwiLCBbXSlcclxuICAgICAgICAuY29uc3RhbnQoXCJzYXZlQXNcIiwgc2F2ZUFzKVxyXG4gICAgICAgIC5jb25zdGFudChcIlhMU1hcIiwgWExTWClcclxuICAgICAgICAuY29uc3RhbnQoXCJtb21lbnRcIiwgbW9tZW50KVxyXG4gICAgICAgIC5jb25zdGFudChcImN1cnJlbmN5XCIsIGN1cnJlbmN5KVxyXG4gICAgICAgIC5jb25zdGFudChcImFjY291bnRpbmdcIiwgYWNjb3VudGluZylcclxuICAgICAgICAucnVuKEV4Y2VsUnVuKTtcclxufSIsImNsYXNzIEV4Y2VsVXRpbHMge1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgc2F2ZUFzOiBhbnk7XHJcbiAgICBwcml2YXRlIHN0YXRpYyB4bHN4OiBhbnk7XHJcbiAgICBwcml2YXRlIHN0YXRpYyBjdXJyZW5jeTogYW55O1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgYWNjb3VudGluZzogYW55O1xyXG5cclxuICAgIHN0YXRpYyBib290c3RyYXAoc2F2ZUFzOiBhbnksIHhsc3gsIGN1cnJlbmN5OiBhbnksIGFjY291bnRpbmc6IGFueSkge1xyXG4gICAgICAgIEV4Y2VsVXRpbHMuc2F2ZUFzID0gc2F2ZUFzO1xyXG4gICAgICAgIEV4Y2VsVXRpbHMueGxzeCA9IHhsc3g7XHJcbiAgICAgICAgRXhjZWxVdGlscy5jdXJyZW5jeSA9IGN1cnJlbmN5O1xyXG4gICAgICAgIEV4Y2VsVXRpbHMuYWNjb3VudGluZyA9IGFjY291bnRpbmc7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBlbmNvZGVDZWxsKGFkZHJlc3M6IElDZWxsQWRkcmVzcykge1xyXG4gICAgICAgIHJldHVybiBFeGNlbFV0aWxzLnhsc3gudXRpbHMuZW5jb2RlX2NlbGwoYWRkcmVzcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBlbmNvZGVSYW5nZShyYW5nZTogSUNlbGxSYW5nZSkge1xyXG4gICAgICAgIHJldHVybiBFeGNlbFV0aWxzLnhsc3gudXRpbHMuZW5jb2RlX3JhbmdlKHJhbmdlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGdldEN1cnJlbmN5Rm9ybWF0KGN1cnJlbmN5OiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbmN5U3ltYm9sID0gRXhjZWxVdGlscy5jdXJyZW5jeS5zeW1ib2xpemUoY3VycmVuY3kpO1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbmN5U2V0dGluZ3MgPSBFeGNlbFV0aWxzLmFjY291bnRpbmcuc2V0dGluZ3MuY3VycmVuY3k7XHJcbiAgICAgICAgdmFyIGN1cnJlbmN5Rm9ybWF0ID0gYCR7Y3VycmVuY3lTeW1ib2x9IyR7Y3VycmVuY3lTZXR0aW5ncy50aG91c2FuZH0jIzAke2N1cnJlbmN5U2V0dGluZ3MuZGVjaW1hbH0wMGA7XHJcbiAgICAgICAgcmV0dXJuIGN1cnJlbmN5Rm9ybWF0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZm9ybWF0VGltZShpc29UaW1lOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gICAgICAgIGlmIChpc29UaW1lID09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgY29uc3QgU0VDT05EU19JTl9EQVkgPSA4NjQwMDtcclxuICAgICAgICBjb25zdCBTRUNPTkRTX0lOX0hPVVIgPSAzNjAwO1xyXG4gICAgICAgIGNvbnN0IFNFQ09ORFNfSU5fTUlOVVRFID0gNjA7XHJcblxyXG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IGlzb1RpbWUuc3BsaXQoXCI6XCIpO1xyXG4gICAgICAgIGNvbnN0IGhvdXJTZWNvbmRzID0gTnVtYmVyKHZhbHVlc1swXSkgKiBTRUNPTkRTX0lOX0hPVVI7XHJcbiAgICAgICAgY29uc3QgbWludXRlU2Vjb25kcyA9IE51bWJlcih2YWx1ZXNbMV0pICogU0VDT05EU19JTl9NSU5VVEU7XHJcbiAgICAgICAgY29uc3Qgc2Vjb25kcyA9IE51bWJlcih2YWx1ZXNbMl0pO1xyXG4gICAgICAgIGNvbnN0IHRvdGFsU2Vjb25kcyA9IGhvdXJTZWNvbmRzICsgbWludXRlU2Vjb25kcyArIHNlY29uZHM7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSB0b3RhbFNlY29uZHMgLyBTRUNPTkRTX0lOX0RBWTtcclxuICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBjb252ZXJ0VG9CaW5hcnkod29ya2Jvb2s6IHN0cmluZyk6IEFycmF5QnVmZmVyIHtcclxuICAgICAgICB2YXIgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKHdvcmtib29rLmxlbmd0aCk7XHJcbiAgICAgICAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpICE9PSB3b3JrYm9vay5sZW5ndGg7ICsraSlcclxuICAgICAgICAgICAgdmlld1tpXSA9IHdvcmtib29rLmNoYXJDb2RlQXQoaSkgJiAweEZGO1xyXG4gICAgICAgIHJldHVybiBidWZmZXI7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyB3cml0ZVdvcmtib29rKHdvcmtib29rOiBJV29ya0Jvb2ssIG9wdGlvbnM/OiBhbnksIGVuYWJsZUxlZ2FjeVNhZmFyaVN1cHBvcnQgPSB0cnVlKTogc3RyaW5nIHtcclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7XHJcbiAgICAgICAgICAgIGJvb2tUeXBlOiAneGxzeCcsIFxyXG4gICAgICAgICAgICB0eXBlOiAnYmluYXJ5J1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgb3B0aW9ucy5ib29rU1NUID0gZW5hYmxlTGVnYWN5U2FmYXJpU3VwcG9ydDtcclxuICAgICAgICByZXR1cm4gdGhpcy54bHN4LndyaXRlKHdvcmtib29rLCBvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIHNhdmVCdWZmZXIobmFtZTogc3RyaW5nLCBidWZmZXI6IEFycmF5QnVmZmVyKSB7XHJcbiAgICAgICAgRXhjZWxVdGlscy5zYXZlQXMobmV3IEJsb2IoW2J1ZmZlcl0sIHsgdHlwZTogXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIiB9KSwgYCR7bmFtZX0ueGxzeGApO1xyXG4gICAgfVxyXG59IiwiaW50ZXJmYWNlIElDZWxsQWRkcmVzcyB7XHJcbiAgICBjOiBudW1iZXI7XHJcbiAgICByOiBudW1iZXI7XHJcbn1cclxuXHJcbmNsYXNzIENlbGxBZGRyZXNzIGltcGxlbWVudHMgSUNlbGxBZGRyZXNzIHtcclxuICAgIGNvbnN0cnVjdG9yKHJvdzogbnVtYmVyLCBjb2w6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuciA9IHJvdztcclxuICAgICAgICB0aGlzLmMgPSBjb2w7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gMC1pbmRleGVkIGNvbHVtblxyXG4gICAgYzogbnVtYmVyO1xyXG4gICAgLy8gMC1pbmRleGVkIHJvd1xyXG4gICAgcjogbnVtYmVyO1xyXG59IiwiaW50ZXJmYWNlIElDZWxsUmFuZ2Uge1xyXG4gICAgYWRkQWRkcmVzcyhhZGRyZXNzOiBJQ2VsbEFkZHJlc3MpO1xyXG59XHJcblxyXG5jbGFzcyBDZWxsUmFuZ2UgaW1wbGVtZW50cyBJQ2VsbFJhbmdlIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMucyA9IG5ldyBDZWxsQWRkcmVzcygwLCAwKTtcclxuICAgICAgICB0aGlzLmUgPSBuZXcgQ2VsbEFkZHJlc3MoMCwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc3RhcnRcclxuICAgIHM6IENlbGxBZGRyZXNzO1xyXG4gICAgLy8gZW5kXHJcbiAgICBlOiBDZWxsQWRkcmVzcztcclxuXHJcbiAgICBhZGRBZGRyZXNzKGFkZHJlc3M6IElDZWxsQWRkcmVzcykge1xyXG4gICAgICAgIGlmIChhZGRyZXNzLnIgPCB0aGlzLnMucilcclxuICAgICAgICAgICAgdGhpcy5zLnIgPSBhZGRyZXNzLnI7XHJcbiAgICAgICAgaWYgKGFkZHJlc3MuYyA8IHRoaXMucy5jKVxyXG4gICAgICAgICAgICB0aGlzLnMuYyA9IGFkZHJlc3MuYztcclxuXHJcbiAgICAgICAgaWYgKGFkZHJlc3MuciA+IHRoaXMuZS5yKVxyXG4gICAgICAgICAgICB0aGlzLmUuciA9IGFkZHJlc3MucjtcclxuICAgICAgICBpZiAoYWRkcmVzcy5jID4gdGhpcy5lLmMpXHJcbiAgICAgICAgICAgIHRoaXMuZS5jID0gYWRkcmVzcy5jO1xyXG4gICAgfVxyXG59IiwiLy8gc2VlOiBodHRwczovL2dpdGh1Yi5jb20vU2hlZXRKUy9qcy14bHN4I2NlbGwtb2JqZWN0XHJcblxyXG5pbnRlcmZhY2UgSUNlbGwge1xyXG4gICAgdjogc3RyaW5nO1xyXG4gICAgdzogc3RyaW5nO1xyXG4gICAgdDogc3RyaW5nO1xyXG4gICAgZjogc3RyaW5nO1xyXG4gICAgRjogc3RyaW5nO1xyXG4gICAgcjogc3RyaW5nO1xyXG4gICAgaDogc3RyaW5nO1xyXG4gICAgYzogc3RyaW5nO1xyXG4gICAgejogc3RyaW5nO1xyXG4gICAgbDogc3RyaW5nO1xyXG4gICAgczogc3RyaW5nO1xyXG59XHJcblxyXG5jbGFzcyBDZWxsIGltcGxlbWVudHMgSUNlbGwge1xyXG4gICAgcHJvdGVjdGVkIHNldFZhbHVlKHZhbHVlOiBhbnksIHR5cGU6IHN0cmluZywgZm9ybWF0Pzogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKHZhbHVlID09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB0aGlzLnYgPSB2YWx1ZS50b1N0cmluZygpO1xyXG4gICAgICAgIHRoaXMudCA9IHR5cGU7XHJcbiAgICAgICAgdGhpcy56ID0gZm9ybWF0O1xyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCBzZXRGb3JtYXQoZm9ybWF0Pzogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy56ID0gZm9ybWF0O1xyXG4gICAgfVxyXG5cclxuICAgIHY6IHN0cmluZztcclxuICAgIHc6IHN0cmluZztcclxuICAgIHQ6IHN0cmluZztcclxuICAgIGY6IHN0cmluZztcclxuICAgIEY6IHN0cmluZztcclxuICAgIHI6IHN0cmluZztcclxuICAgIGg6IHN0cmluZztcclxuICAgIGM6IHN0cmluZztcclxuICAgIHo6IHN0cmluZztcclxuICAgIGw6IHN0cmluZztcclxuICAgIHM6IHN0cmluZztcclxufVxyXG5cclxuY2xhc3MgRGF0ZUNlbGwgZXh0ZW5kcyBDZWxsIHtcclxuICAgIGNvbnN0cnVjdG9yKGlzb0RhdGU6IHN0cmluZykge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5zZXRWYWx1ZShpc29EYXRlLCAnZCcpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBDdXJyZW5jeUNlbGwgZXh0ZW5kcyBDZWxsIHtcclxuICAgIGNvbnN0cnVjdG9yKHZhbHVlOiBudW1iZXIsIGZvcm1hdDogc3RyaW5nID0gXCIkIywjIzAuMDBcIikge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5zZXRWYWx1ZSh2YWx1ZSwgJ24nLCBmb3JtYXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldEZvcm1hdChmb3JtYXQ6IHN0cmluZykge1xyXG4gICAgICAgIHN1cGVyLnNldEZvcm1hdChmb3JtYXQpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBUaW1lQ2VsbCBleHRlbmRzIENlbGwge1xyXG4gICAgY29uc3RydWN0b3IoaXNvVGltZTogc3RyaW5nLCBmb3JtYXQ6IHN0cmluZyA9IFwiaDptbSBBTS9QTVwiKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICBjb25zdCB2YWx1ZSA9IEV4Y2VsVXRpbHMuZm9ybWF0VGltZShpc29UaW1lKTtcclxuICAgICAgICB0aGlzLnNldFZhbHVlKHZhbHVlLCAnbicsIGZvcm1hdCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIE51bWJlckNlbGwgZXh0ZW5kcyBDZWxsIHtcclxuICAgIGNvbnN0cnVjdG9yKHZhbHVlPzogYW55KSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLnNldFZhbHVlKHZhbHVlLCAnbicpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBTdHJpbmdDZWxsIGV4dGVuZHMgQ2VsbCB7XHJcbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZT86IGFueSkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5zZXRWYWx1ZSh2YWx1ZSwgJ3MnKTtcclxuICAgIH1cclxufSIsImludGVyZmFjZSBJV29ya1NoZWV0IHtcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIHNldENlbGwocm93OiBudW1iZXIsIGNvbDogbnVtYmVyLCB2YWx1ZTogYW55LCBjZWxsPzogSUNlbGwpO1xyXG4gICAgZ2V0Q2VsbChyb3c6IG51bWJlciwgY29sOiBudW1iZXIpOiBJQ2VsbDtcclxufVxyXG5cclxuY2xhc3MgV29ya1NoZWV0IGltcGxlbWVudHMgSVdvcmtTaGVldCB7XHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZSkge1xyXG4gICAgICAgIHRoaXMuX3JhbmdlID0gbmV3IENlbGxSYW5nZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3JhbmdlOiBJQ2VsbFJhbmdlO1xyXG5cclxuICAgIHNldENlbGwocm93OiBudW1iZXIsIGNvbDogbnVtYmVyLCB2YWx1ZTogYW55LCBjZWxsPzogSUNlbGwpIHtcclxuICAgICAgICB2YXIgYWRkcmVzcyA9IG5ldyBDZWxsQWRkcmVzcyhyb3csIGNvbCk7XHJcbiAgICAgICAgaWYgKCFjZWxsKVxyXG4gICAgICAgICAgICBjZWxsID0gbmV3IFN0cmluZ0NlbGwodmFsdWUpO1xyXG5cclxuICAgICAgICB2YXIgY2VsbFJlZmVyZW5jZSA9IEV4Y2VsVXRpbHMuZW5jb2RlQ2VsbChhZGRyZXNzKTtcclxuICAgICAgICB0aGlzW2NlbGxSZWZlcmVuY2VdID0gY2VsbDtcclxuXHJcbiAgICAgICAgdGhpcy5fcmFuZ2UuYWRkQWRkcmVzcyhhZGRyZXNzKTtcclxuICAgICAgICB0aGlzW1wiIXJlZlwiXSA9IEV4Y2VsVXRpbHMuZW5jb2RlUmFuZ2UodGhpcy5fcmFuZ2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldENlbGwocm93OiBudW1iZXIsIGNvbDogbnVtYmVyKTogSUNlbGwge1xyXG4gICAgICAgIHZhciBhZGRyZXNzID0gbmV3IENlbGxBZGRyZXNzKHJvdywgY29sKTtcclxuICAgICAgICB2YXIgY2VsbFJlZmVyZW5jZSA9IEV4Y2VsVXRpbHMuZW5jb2RlQ2VsbChhZGRyZXNzKTtcclxuICAgICAgICB2YXIgY2VsbCA9IHRoaXNbY2VsbFJlZmVyZW5jZV07XHJcbiAgICAgICAgcmV0dXJuIGNlbGw7XHJcbiAgICB9XHJcbn0iLCJpbnRlcmZhY2UgSVdvcmtCb29rIHtcclxuICAgIGFkZFdvcmtTaGVldCh3czogc3RyaW5nIHwgSVdvcmtTaGVldCk6IElXb3JrU2hlZXQ7XHJcbiAgICBzYXZlKCk7XHJcbiAgICBzYXZlQXMobmFtZTogc3RyaW5nKTtcclxufVxyXG5cclxuY2xhc3MgV29ya0Jvb2sgaW1wbGVtZW50cyBJV29ya0Jvb2sge1xyXG4gICAgY29uc3RydWN0b3IocHVibGljIG5hbWU6IHN0cmluZyA9IFwiV29ya2Jvb2tcIikge1xyXG4gICAgICAgIHRoaXNbJ1NoZWV0TmFtZXMnXSA9IFtdO1xyXG4gICAgICAgIHRoaXNbJ1NoZWV0cyddID0ge307XHJcbiAgICB9XHJcblxyXG4gICAgYWRkV29ya1NoZWV0KHdvcmtzaGVldDogc3RyaW5nIHwgSVdvcmtTaGVldCk6IElXb3JrU2hlZXQge1xyXG4gICAgICAgIGlmICh0eXBlb2Ygd29ya3NoZWV0ID09IFwic3RyaW5nXCIpXHJcbiAgICAgICAgICAgIHdvcmtzaGVldCA9IG5ldyBXb3JrU2hlZXQod29ya3NoZWV0KTtcclxuXHJcbiAgICAgICAgY29uc3QgbmFtZSA9IHdvcmtzaGVldC5uYW1lO1xyXG4gICAgICAgIGxldCBzaGVldE5hbWVzOiBzdHJpbmdbXSA9IHRoaXNbJ1NoZWV0TmFtZXMnXTtcclxuICAgICAgICBzaGVldE5hbWVzLnB1c2gobmFtZSk7XHJcbiAgICAgICAgdGhpc1snU2hlZXRzJ11bbmFtZV0gPSB3b3Jrc2hlZXQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHdvcmtzaGVldDtcclxuICAgIH1cclxuXHJcbiAgICBzYXZlKCkge1xyXG4gICAgICAgIHRoaXMuc2F2ZUFzKHRoaXMubmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2F2ZUFzKG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IHdib3V0ID0gRXhjZWxVdGlscy53cml0ZVdvcmtib29rKHRoaXMpO1xyXG4gICAgICAgIHZhciBidWZmZXIgPSBFeGNlbFV0aWxzLmNvbnZlcnRUb0JpbmFyeSh3Ym91dCk7XHJcbiAgICAgICAgRXhjZWxVdGlscy5zYXZlQnVmZmVyKG5hbWUsIGJ1ZmZlcik7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfc2hlZXROYW1lczogc3RyaW5nW107XHJcbiAgICBwcml2YXRlIF9zaGVldHM6IHN0cmluZ1tdW107XHJcbn0iLCJpbnRlcmZhY2UgSUV4Y2VsQnVpbGRlciB7XHJcbiAgICBzZXRDdXJyZW5jeShjdXJyZW5jeTogc3RyaW5nKTtcclxuICAgIHNldE5hbWUobmFtZTogc3RyaW5nKTtcclxufVxyXG5cclxuY2xhc3MgRXhjZWxCdWlsZGVyIGltcGxlbWVudHMgSUV4Y2VsQnVpbGRlciB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLnJvd3MgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRDdXJyZW5jeShjdXJyZW5jeTogc3RyaW5nKTogSUV4Y2VsQnVpbGRlciB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW5jeUZvcm1hdCA9IEV4Y2VsVXRpbHMuZ2V0Q3VycmVuY3lGb3JtYXQoY3VycmVuY3kpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHNldE5hbWUobmFtZTogc3RyaW5nKTogSUV4Y2VsQnVpbGRlciB7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBhZGRSb3cocm93OiBJRXhjZWxSb3cpOiBJRXhjZWxCdWlsZGVyIHtcclxuICAgICAgICB0aGlzLnJvd3MucHVzaChyb3cpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGJ1aWxkKCk6IElXb3JrU2hlZXQge1xyXG4gICAgICAgIHZhciB3b3Jrc2hlZXQgPSBuZXcgV29ya1NoZWV0KHRoaXMubmFtZSk7XHJcblxyXG4gICAgICAgIHRoaXMucm93cy5mb3JFYWNoKChyb3csIHJvd0lkeCkgPT4ge1xyXG4gICAgICAgICAgICByb3cuY2VsbHMuZm9yRWFjaCgoY2VsbCwgY2VsbElkeCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYoY2VsbCBpbnN0YW5jZW9mIEN1cnJlbmN5Q2VsbClcclxuICAgICAgICAgICAgICAgICAgICBjZWxsLnNldEZvcm1hdCh0aGlzLmN1cnJlbmN5Rm9ybWF0KTtcclxuICAgICAgICAgICAgICAgIHdvcmtzaGVldC5zZXRDZWxsKHJvd0lkeCwgY2VsbElkeCwgbnVsbCwgY2VsbCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gd29ya3NoZWV0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3VycmVuY3lGb3JtYXQ6IHN0cmluZztcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIHByaXZhdGUgcm93czogSUV4Y2VsUm93W107XHJcbn1cclxuXHJcbmludGVyZmFjZSBJRXhjZWxSb3cge1xyXG4gICAgYWRkRW1wdHkoKTogSUV4Y2VsUm93O1xyXG4gICAgYWRkU3RyaW5nKHZhbHVlPzogc3RyaW5nKTogSUV4Y2VsUm93O1xyXG4gICAgYWRkTnVtYmVyKHZhbHVlPzogYW55KTogSUV4Y2VsUm93O1xyXG4gICAgYWRkQ3VycmVuY3kodmFsdWU/OiBudW1iZXIpOiBJRXhjZWxSb3c7XHJcbiAgICBhZGREYXRlKGlzb0RhdGU/OiBzdHJpbmcpOiBJRXhjZWxSb3c7XHJcbiAgICBhZGRUaW1lKGlzb1RpbWU/OiBzdHJpbmcpOiBJRXhjZWxSb3c7XHJcbiAgICBhZGRDZWxsKGNlbGw6IElDZWxsKTogSUV4Y2VsUm93O1xyXG4gICAgY2VsbHM6IElDZWxsW107XHJcbn1cclxuXHJcbmNsYXNzIEV4Y2VsUm93IGltcGxlbWVudHMgSUV4Y2VsUm93IHtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgY3VycmVuY3lGb3JtYXQ6IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMuY2VsbHMgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRFbXB0eSgpOiBJRXhjZWxSb3cge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmFkZFN0cmluZygpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFN0cmluZyh2YWx1ZT86IHN0cmluZyk6IElFeGNlbFJvdyB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkQ2VsbChuZXcgU3RyaW5nQ2VsbCh2YWx1ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZE51bWJlcih2YWx1ZT86IGFueSk6IElFeGNlbFJvdyB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkQ2VsbChuZXcgTnVtYmVyQ2VsbCh2YWx1ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZEN1cnJlbmN5KHZhbHVlPzogbnVtYmVyLCBmb3JtYXQ/OiBzdHJpbmcpOiBJRXhjZWxSb3cge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmFkZENlbGwobmV3IEN1cnJlbmN5Q2VsbCh2YWx1ZSwgZm9ybWF0KSk7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkRGF0ZShpc29EYXRlPzogc3RyaW5nKTogSUV4Y2VsUm93IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hZGRDZWxsKG5ldyBEYXRlQ2VsbChpc29EYXRlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkVGltZShpc29UaW1lPzogc3RyaW5nLCBmb3JtYXQ/OiBzdHJpbmcpOiBJRXhjZWxSb3cge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmFkZENlbGwobmV3IFRpbWVDZWxsKGlzb1RpbWUsIGZvcm1hdCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZENlbGwoY2VsbDogSUNlbGwpOiBJRXhjZWxSb3cge1xyXG4gICAgICAgIHRoaXMuY2VsbHMucHVzaChjZWxsKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2VsbHM6IElDZWxsW107XHJcbn0iLCJpbnRlcmZhY2UgSVdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgYWRkVGltZUNvbHVtbihuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246ICh4OiBUKSA9PiBhbnksIGZvcm1hdD86IHN0cmluZyk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+XHJcbiAgICBhZGREYXRlQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+O1xyXG4gICAgYWRkTnVtYmVyQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+XHJcbiAgICBhZGRDdXJyZW5jeUNvbHVtbihuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246ICh4OiBUKSA9PiBhbnksIGdldEN1cnJlbmN5PzogKHg6IFQpID0+IHN0cmluZyk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+XHJcbiAgICBhZGRDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55LCBjcmVhdGVDZWxsPzogKHg6IGFueSkgPT4gSUNlbGwpOiBJV29ya1NoZWV0QnVpbGRlcjxUPjtcclxuICAgIHNldE5hbWUobmFtZTogc3RyaW5nKTogSVdvcmtTaGVldEJ1aWxkZXI8VD47XHJcbiAgICBzZXRDdXJyZW5jeShjdXJyZW5jeUZvcm1hdDogc3RyaW5nKTogSVdvcmtTaGVldEJ1aWxkZXI8VD47XHJcbiAgICBidWlsZCgpOiBJV29ya1NoZWV0O1xyXG59XHJcblxyXG5jbGFzcyBXb3JrU2hlZXRCdWlsZGVyPFQ+IGltcGxlbWVudHMgSVdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSB2YWx1ZXM6IFRbXSkge1xyXG4gICAgICAgIHRoaXMuY29sdW1ucyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFRpbWVDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55LCBmb3JtYXQ/OiBzdHJpbmcpOiBJV29ya1NoZWV0QnVpbGRlcjxUPiB7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5zLnB1c2goeyBuYW1lOiBuYW1lLCBleHByZXNzaW9uOiBleHByZXNzaW9uLCBjcmVhdGVDZWxsOiB4ID0+IG5ldyBUaW1lQ2VsbCh4LCBmb3JtYXQpIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZERhdGVDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55KTogSVdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgICAgIHRoaXMuY29sdW1ucy5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogbmFtZSxcclxuICAgICAgICAgICAgZXhwcmVzc2lvbjogZXhwcmVzc2lvbixcclxuICAgICAgICAgICAgY3JlYXRlQ2VsbDogeCA9PiBuZXcgRGF0ZUNlbGwoeClcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBhZGROdW1iZXJDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55KTogSVdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgICAgIHRoaXMuY29sdW1ucy5wdXNoKHsgbmFtZTogbmFtZSwgZXhwcmVzc2lvbjogZXhwcmVzc2lvbiwgY3JlYXRlQ2VsbDogeCA9PiBuZXcgTnVtYmVyQ2VsbCh4KSB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBhZGRDdXJyZW5jeUNvbHVtbihuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246ICh4OiBUKSA9PiBhbnksIGdldEN1cnJlbmN5PzogKHg6IFQpID0+IHN0cmluZyk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgICAgICB0aGlzLmNvbHVtbnMucHVzaCh7XHJcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsIGV4cHJlc3Npb246IGV4cHJlc3Npb24sIGNyZWF0ZUNlbGw6ICh2YWx1ZSwgeCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvcm1hdCA9IGdldEN1cnJlbmN5ID8gRXhjZWxVdGlscy5nZXRDdXJyZW5jeUZvcm1hdChnZXRDdXJyZW5jeSh4KSkgOiB0aGlzLmN1cnJlbmN5Rm9ybWF0O1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBDdXJyZW5jeUNlbGwodmFsdWUsIGZvcm1hdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBhZGRDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55LCBjcmVhdGVDZWxsPzogKHg6IGFueSkgPT4gSUNlbGwpOiBJV29ya1NoZWV0QnVpbGRlcjxUPiB7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5zLnB1c2goeyBuYW1lOiBuYW1lLCBleHByZXNzaW9uOiBleHByZXNzaW9uLCBjcmVhdGVDZWxsOiBjcmVhdGVDZWxsIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHNldEN1cnJlbmN5KGN1cnJlbmN5OiBzdHJpbmcpOiBJV29ya1NoZWV0QnVpbGRlcjxUPiB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW5jeUZvcm1hdCA9IEV4Y2VsVXRpbHMuZ2V0Q3VycmVuY3lGb3JtYXQoY3VycmVuY3kpXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0TmFtZShuYW1lOiBzdHJpbmcpOiBJV29ya1NoZWV0QnVpbGRlcjxUPiB7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBidWlsZCgpOiBJV29ya1NoZWV0IHtcclxuICAgICAgICB2YXIgd29ya3NoZWV0ID0gbmV3IFdvcmtTaGVldCh0aGlzLm5hbWUpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjb2xJZHggPSAwOyBjb2xJZHggPCB0aGlzLmNvbHVtbnMubGVuZ3RoOyBjb2xJZHgrKykge1xyXG4gICAgICAgICAgICBsZXQgY29sdW1uID0gdGhpcy5jb2x1bW5zW2NvbElkeF07XHJcbiAgICAgICAgICAgIHdvcmtzaGVldC5zZXRDZWxsKDAsIGNvbElkeCwgY29sdW1uLm5hbWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy52YWx1ZXMuZm9yRWFjaCgoeCwgcm93SWR4KSA9PiB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGNvbElkeCA9IDA7IGNvbElkeCA8IHRoaXMuY29sdW1ucy5sZW5ndGg7IGNvbElkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29sdW1uID0gdGhpcy5jb2x1bW5zW2NvbElkeF07XHJcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGNvbHVtbi5leHByZXNzaW9uKHgpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2VsbCA9IGNvbHVtbi5jcmVhdGVDZWxsID8gY29sdW1uLmNyZWF0ZUNlbGwodmFsdWUsIHgpIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIHdvcmtzaGVldC5zZXRDZWxsKHJvd0lkeCArIDEsIGNvbElkeCwgdmFsdWUsIGNlbGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiB3b3Jrc2hlZXQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBuYW1lOiBzdHJpbmc7XHJcbiAgICBwcml2YXRlIGN1cnJlbmN5Rm9ybWF0OiBzdHJpbmc7XHJcbiAgICBwcml2YXRlIGNvbHVtbnM6IHsgbmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55LCBjcmVhdGVDZWxsPzogKHZhbHVlOiBhbnksIHg6IFQpID0+IElDZWxsIH1bXTtcclxufSIsImludGVyZmFjZSBJRXhjZWxDb252ZXJ0ZXIge1xyXG4gICAgY3JlYXRlKCk6IElXb3JrQm9vaztcclxuICAgIGNyZWF0ZUJ1aWxkZXI8VD4odmFsdWVzOiBUW10pOiBJV29ya1NoZWV0QnVpbGRlcjxUPjtcclxuICAgIGNyZWF0ZUNvbXBsZXhCdWlsZGVyKCk6IElFeGNlbEJ1aWxkZXI7XHJcbiAgICBzYXZlQXMobmFtZTogc3RyaW5nLCB3b3JrYm9vazogSVdvcmtCb29rKTtcclxufVxyXG5cclxuY2xhc3MgRXhjZWxDb252ZXJ0ZXIgaW1wbGVtZW50cyBJRXhjZWxDb252ZXJ0ZXIge1xyXG5cclxuICAgIGNyZWF0ZSgpOiBJV29ya0Jvb2sge1xyXG4gICAgICAgIHJldHVybiBuZXcgV29ya0Jvb2sobnVsbCk7XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlQnVpbGRlcjxUPih2YWx1ZXM6IFRbXSk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFdvcmtTaGVldEJ1aWxkZXIodmFsdWVzKTtcclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVDb21wbGV4QnVpbGRlcigpOiBJRXhjZWxCdWlsZGVyIHtcclxuICAgICAgICByZXR1cm4gbmV3IEV4Y2VsQnVpbGRlcigpO1xyXG4gICAgfVxyXG5cclxuICAgIHNhdmVBcyhuYW1lOiBzdHJpbmcsIHdvcmtib29rOiBJV29ya0Jvb2spIHtcclxuICAgICAgICB3b3JrYm9vay5zYXZlQXMobmFtZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbkFuZ3VsYXIubW9kdWxlKFwiYW5ndWxhci1leGNlbFwiKS5zZXJ2aWNlKCdleGNlbENvbnZlcnRlcicsIEV4Y2VsQ29udmVydGVyKTsiXX0=