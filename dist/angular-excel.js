var excel;
(function (excel) {
    Angular.module("angular-excel", [])
        .constant("saveAs", saveAs)
        .constant("XLSX", XLSX)
        .constant("moment", moment)
        .constant("currency", currency)
        .constant("accounting", accounting);
})(excel || (excel = {}));
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
    return Cell;
}());
var DateCell = (function () {
    function DateCell(value) {
        if (value == null)
            return;
        this.v = value;
        this.t = 'd';
    }
    return DateCell;
}());
var CurrencyCell = (function () {
    function CurrencyCell(value, format) {
        if (value == null)
            return;
        this.v = value;
        this.t = 'n';
        this.z = format;
    }
    return CurrencyCell;
}());
var TimeCell = (function () {
    function TimeCell(isoTime, format) {
        if (format === void 0) { format = "h:mm AM/PM"; }
        if (isoTime == null)
            return;
        var values = isoTime.split(":");
        var hourSeconds = Number(values[0]) * TimeCell.SECONDS_IN_HOUR;
        var minuteSeconds = Number(values[1]) * TimeCell.SECONDS_IN_MINUTE;
        var seconds = Number(values[2]);
        var totalSeconds = hourSeconds + minuteSeconds + seconds;
        var value = totalSeconds / TimeCell.SECONDS_IN_DAY;
        this.v = value;
        this.t = 'n';
        this.z = format;
    }
    TimeCell.SECONDS_IN_DAY = 86400;
    TimeCell.SECONDS_IN_HOUR = 3600;
    TimeCell.SECONDS_IN_MINUTE = 60;
    return TimeCell;
}());
var NumberCell = (function () {
    function NumberCell(value) {
        if (value == null)
            return;
        this.v = value;
        this.t = 'n';
    }
    return NumberCell;
}());
var StringCell = (function () {
    function StringCell(value) {
        if (value == null)
            return;
        this.v = value;
        this.t = 's';
    }
    return StringCell;
}());
var WorkSheet = (function () {
    function WorkSheet(name, xlsx) {
        this.name = name;
        this.xlsx = xlsx;
        this._range = new CellRange();
    }
    WorkSheet.prototype.setCell = function (row, col, value, cell) {
        var address = new CellAddress(row, col);
        if (!cell)
            cell = new StringCell(value);
        var cellReference = this.xlsx.utils.encode_cell(address);
        this[cellReference] = cell;
        this._range.addAddress(address);
        this["!ref"] = this.xlsx.utils.encode_range(this._range);
    };
    WorkSheet.prototype.getCell = function (row, col) {
        var address = new CellAddress(row, col);
        var cellReference = this.xlsx.utils.encode_cell(address);
        var cell = this[cellReference];
        return cell;
    };
    return WorkSheet;
}());
var WorkBook = (function () {
    function WorkBook(xlsx) {
        this.xlsx = xlsx;
        this['SheetNames'] = [];
        this['Sheets'] = {};
    }
    WorkBook.prototype.addWorkSheet = function (worksheet) {
        if (typeof worksheet == "string")
            worksheet = new WorkSheet(worksheet, this.xlsx);
        var name = worksheet.name;
        var sheetNames = this['SheetNames'];
        sheetNames.push(name);
        this['Sheets'][name] = worksheet;
        return worksheet;
    };
    return WorkBook;
}());
var WorkSheetBuilder = (function () {
    function WorkSheetBuilder(xlsx, moment, currency, accounting, values) {
        this.xlsx = xlsx;
        this.moment = moment;
        this.currency = currency;
        this.accounting = accounting;
        this.values = values;
        this.columns = [];
    }
    WorkSheetBuilder.prototype.addTimeColumn = function (name, expression, format) {
        this.columns.push({ name: name, expression: expression, createCell: function (x) { return new TimeCell(x, format); } });
        return this;
    };
    WorkSheetBuilder.prototype.addDateColumn = function (name, expression) {
        var _this = this;
        this.columns.push({
            name: name,
            expression: expression,
            createCell: function (x) {
                var value = !_this.timeZone ? x : _this.moment(x, 'YYYY-MM-DD').tz(_this.timeZone).format('YYYY-MM-DD HH:mm:ss');
                return new DateCell(value);
            }
        });
        return this;
    };
    WorkSheetBuilder.prototype.addNumberColumn = function (name, expression) {
        this.columns.push({ name: name, expression: expression, createCell: function (x) { return new NumberCell(x); } });
        return this;
    };
    WorkSheetBuilder.prototype.getCurrencyFormat = function (currency) {
        var currencySymbol = this.currency.symbolize(currency);
        var currencySettings = this.accounting.settings.currency;
        var currencyFormat = currencySymbol + "#" + currencySettings.thousand + "##0" + currencySettings.decimal + "00";
        return currencyFormat;
    };
    WorkSheetBuilder.prototype.addCurrencyColumn = function (name, expression, getCurrency) {
        var _this = this;
        this.columns.push({
            name: name, expression: expression, createCell: function (value, x) {
                var format = getCurrency ? _this.getCurrencyFormat(getCurrency(x)) : _this.currencyFormat;
                return new CurrencyCell(value, format);
            }
        });
        return this;
    };
    WorkSheetBuilder.prototype.addColumn = function (name, expression, createCell) {
        this.columns.push({ name: name, expression: expression, createCell: createCell });
        return this;
    };
    WorkSheetBuilder.prototype.setTimeZone = function (timeZone) {
        this.timeZone = timeZone;
        return this;
    };
    WorkSheetBuilder.prototype.setCurrency = function (currency) {
        this.currencyFormat = this.getCurrencyFormat(currency);
        return this;
    };
    WorkSheetBuilder.prototype.setName = function (name) {
        this.name = name;
        return this;
    };
    WorkSheetBuilder.prototype.build = function () {
        var _this = this;
        var worksheet = new WorkSheet(this.name, this.xlsx);
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
    function ExcelConverter(_saveAs, xlsx, moment, currency, accounting) {
        this._saveAs = _saveAs;
        this.xlsx = xlsx;
        this.moment = moment;
        this.currency = currency;
        this.accounting = accounting;
    }
    ExcelConverter.prototype.create = function () {
        var wb = new WorkBook(this.xlsx);
        return wb;
    };
    ExcelConverter.prototype.createBuilder = function (values) {
        var builder = new WorkSheetBuilder(this.xlsx, this.moment, this.currency, this.accounting, values);
        return builder;
    };
    ExcelConverter.prototype.saveAs = function (name, workbook) {
        var wbout = this.xlsx.write(workbook, { bookType: 'xlsx', bookSST: false, type: 'binary' });
        var buffer = this.convertToBinary(wbout);
        this._saveAs(new Blob([buffer], { type: "application/octet-stream" }), name + ".xlsx");
    };
    ExcelConverter.prototype.convertToBinary = function (workbook) {
        var buffer = new ArrayBuffer(workbook.length);
        var view = new Uint8Array(buffer);
        for (var i = 0; i !== workbook.length; ++i)
            view[i] = workbook.charCodeAt(i) & 0xFF;
        return buffer;
    };
    ExcelConverter.$inject = ['saveAs', 'XLSX', 'moment', 'currency', 'accounting'];
    return ExcelConverter;
}());
Angular.module("angular-excel").service('excelConverter', ExcelConverter);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ndWxhci1leGNlbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9hcHAudHMiLCIuLi9zcmMvY2VsbEFkZHJlc3MudHMiLCIuLi9zcmMvY2VsbFJhbmdlLnRzIiwiLi4vc3JjL2NlbGwudHMiLCIuLi9zcmMvd29ya3NoZWV0LnRzIiwiLi4vc3JjL3dvcmtib29rLnRzIiwiLi4vc3JjL3dvcmtzaGVldEJ1aWxkZXIudHMiLCIuLi9zcmMvZXhjZWxDb252ZXJ0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBVSxLQUFLLENBYWQ7QUFiRCxXQUFVLEtBQUs7SUFPWCxPQUFPLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUM7U0FDOUIsUUFBUSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUM7U0FDMUIsUUFBUSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUM7U0FDdEIsUUFBUSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUM7U0FDMUIsUUFBUSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUM7U0FDOUIsUUFBUSxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztBQUM1QyxDQUFDLEVBYlMsS0FBSyxLQUFMLEtBQUssUUFhZDtBQ1JEO0lBQ0kscUJBQVksR0FBVyxFQUFFLEdBQVc7UUFDaEMsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDYixJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUNqQixDQUFDO0lBTUwsa0JBQUM7QUFBRCxDQUFDLEFBVkQsSUFVQztBQ1hEO0lBQ0k7UUFDSSxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksV0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMvQixJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksV0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBT0QsOEJBQVUsR0FBVixVQUFXLE9BQXFCO1FBQzVCLEVB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Q0FBQyxDQUFDO0lBNkI1RSxxQkFBQztDQUFBLEFBL0JELElBK0JDO0FBRUQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJuYW1lc3BhY2UgZXhjZWwge1xyXG4gICAgZGVjbGFyZSB2YXIgWExTWDogYW55O1xyXG4gICAgZGVjbGFyZSB2YXIgc2F2ZUFzOiBhbnk7XHJcbiAgICBkZWNsYXJlIHZhciBtb21lbnQ6IGFueTtcclxuICAgIGRlY2xhcmUgdmFyIGN1cnJlbmN5OiBhbnk7XHJcbiAgICBkZWNsYXJlIHZhciBhY2NvdW50aW5nOiBhbnk7XHJcblxyXG4gICAgQW5ndWxhci5tb2R1bGUoXCJhbmd1bGFyLWV4Y2VsXCIsIFtdKVxyXG4gICAgICAgIC5jb25zdGFudChcInNhdmVBc1wiLCBzYXZlQXMpXHJcbiAgICAgICAgLmNvbnN0YW50KFwiWExTWFwiLCBYTFNYKVxyXG4gICAgICAgIC5jb25zdGFudChcIm1vbWVudFwiLCBtb21lbnQpXHJcbiAgICAgICAgLmNvbnN0YW50KFwiY3VycmVuY3lcIiwgY3VycmVuY3kpXHJcbiAgICAgICAgLmNvbnN0YW50KFwiYWNjb3VudGluZ1wiLCBhY2NvdW50aW5nKTtcclxufSIsImludGVyZmFjZSBJQ2VsbEFkZHJlc3Mge1xyXG4gICAgYzogbnVtYmVyO1xyXG4gICAgcjogbnVtYmVyO1xyXG59XHJcblxyXG5jbGFzcyBDZWxsQWRkcmVzcyBpbXBsZW1lbnRzIElDZWxsQWRkcmVzcyB7XHJcbiAgICBjb25zdHJ1Y3Rvcihyb3c6IG51bWJlciwgY29sOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLnIgPSByb3c7XHJcbiAgICAgICAgdGhpcy5jID0gY29sO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIDAtaW5kZXhlZCBjb2x1bW5cclxuICAgIGM6IG51bWJlcjtcclxuICAgIC8vIDAtaW5kZXhlZCByb3dcclxuICAgIHI6IG51bWJlcjtcclxufSIsImludGVyZmFjZSBJQ2VsbFJhbmdlIHtcclxuICAgIGFkZEFkZHJlc3MoYWRkcmVzczogSUNlbGxBZGRyZXNzKTtcclxufVxyXG5cclxuY2xhc3MgQ2VsbFJhbmdlIGltcGxlbWVudHMgSUNlbGxSYW5nZSB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLnMgPSBuZXcgQ2VsbEFkZHJlc3MoMCwgMCk7XHJcbiAgICAgICAgdGhpcy5lID0gbmV3IENlbGxBZGRyZXNzKDAsIDApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHN0YXJ0XHJcbiAgICBzOiBDZWxsQWRkcmVzcztcclxuICAgIC8vIGVuZFxyXG4gICAgZTogQ2VsbEFkZHJlc3M7XHJcblxyXG4gICAgYWRkQWRkcmVzcyhhZGRyZXNzOiBJQ2VsbEFkZHJlc3MpIHtcclxuICAgICAgICBpZiAoYWRkcmVzcy5yIDwgdGhpcy5zLnIpXHJcbiAgICAgICAgICAgIHRoaXMucy5yID0gYWRkcmVzcy5yO1xyXG4gICAgICAgIGlmIChhZGRyZXNzLmMgPCB0aGlzLnMuYylcclxuICAgICAgICAgICAgdGhpcy5zLmMgPSBhZGRyZXNzLmM7XHJcblxyXG4gICAgICAgIGlmIChhZGRyZXNzLnIgPiB0aGlzLmUucilcclxuICAgICAgICAgICAgdGhpcy5lLnIgPSBhZGRyZXNzLnI7XHJcbiAgICAgICAgaWYgKGFkZHJlc3MuYyA+IHRoaXMuZS5jKVxyXG4gICAgICAgICAgICB0aGlzLmUuYyA9IGFkZHJlc3MuYztcclxuICAgIH1cclxufSIsIi8vIHNlZTogaHR0cHM6Ly9naXRodWIuY29tL1NoZWV0SlMvanMteGxzeCNjZWxsLW9iamVjdFxyXG5cclxuaW50ZXJmYWNlIElDZWxsIHtcclxuICAgIHY6IGFueTtcclxuICAgIHc6IHN0cmluZztcclxuICAgIHQ6IHN0cmluZztcclxuICAgIGY6IHN0cmluZztcclxuICAgIEY6IHN0cmluZztcclxuICAgIHI6IHN0cmluZztcclxuICAgIGg6IHN0cmluZztcclxuICAgIGM6IHN0cmluZztcclxuICAgIHo6IHN0cmluZztcclxuICAgIGw6IHN0cmluZztcclxuICAgIHM6IHN0cmluZztcclxufVxyXG5cclxuY2xhc3MgQ2VsbCBpbXBsZW1lbnRzIElDZWxsIHtcclxuICAgIHY6IGFueTtcclxuICAgIHc6IHN0cmluZztcclxuICAgIHQ6IHN0cmluZztcclxuICAgIGY6IHN0cmluZztcclxuICAgIEY6IHN0cmluZztcclxuICAgIHI6IHN0cmluZztcclxuICAgIGg6IHN0cmluZztcclxuICAgIGM6IHN0cmluZztcclxuICAgIHo6IHN0cmluZztcclxuICAgIGw6IHN0cmluZztcclxuICAgIHM6IHN0cmluZztcclxufVxyXG5cclxuY2xhc3MgRGF0ZUNlbGwgaW1wbGVtZW50cyBJQ2VsbCB7XHJcbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZTogYW55KSB7XHJcbiAgICAgICAgaWYgKHZhbHVlID09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy52ID0gdmFsdWU7XHJcbiAgICAgICAgdGhpcy50ID0gJ2QnO1xyXG4gICAgfVxyXG5cclxuICAgIHY6IGFueTtcclxuICAgIHc6IHN0cmluZztcclxuICAgIHQ6IHN0cmluZztcclxuICAgIGY6IHN0cmluZztcclxuICAgIEY6IHN0cmluZztcclxuICAgIHI6IHN0cmluZztcclxuICAgIGg6IHN0cmluZztcclxuICAgIGM6IHN0cmluZztcclxuICAgIHo6IHN0cmluZztcclxuICAgIGw6IHN0cmluZztcclxuICAgIHM6IHN0cmluZztcclxufVxyXG5cclxuY2xhc3MgQ3VycmVuY3lDZWxsIGltcGxlbWVudHMgSUNlbGwge1xyXG4gICAgY29uc3RydWN0b3IodmFsdWU6IHN0cmluZywgZm9ybWF0OiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLnYgPSB2YWx1ZTtcclxuICAgICAgICB0aGlzLnQgPSAnbic7XHJcbiAgICAgICAgdGhpcy56ID0gZm9ybWF0O1xyXG4gICAgfVxyXG5cclxuICAgIHY6IGFueTtcclxuICAgIHc6IHN0cmluZztcclxuICAgIHQ6IHN0cmluZztcclxuICAgIGY6IHN0cmluZztcclxuICAgIEY6IHN0cmluZztcclxuICAgIHI6IHN0cmluZztcclxuICAgIGg6IHN0cmluZztcclxuICAgIGM6IHN0cmluZztcclxuICAgIHo6IHN0cmluZztcclxuICAgIGw6IHN0cmluZztcclxuICAgIHM6IHN0cmluZztcclxufVxyXG5cclxuY2xhc3MgVGltZUNlbGwgaW1wbGVtZW50cyBJQ2VsbCB7XHJcbiAgICBwcml2YXRlIHN0YXRpYyBTRUNPTkRTX0lOX0RBWSA9IDg2NDAwO1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgU0VDT05EU19JTl9IT1VSID0gMzYwMDtcclxuICAgIHByaXZhdGUgc3RhdGljIFNFQ09ORFNfSU5fTUlOVVRFID0gNjA7XHJcblxyXG4gICAgY29uc3RydWN0b3IoaXNvVGltZTogc3RyaW5nLCBmb3JtYXQ6IHN0cmluZyA9IFwiaDptbSBBTS9QTVwiKSB7XHJcbiAgICAgICAgaWYgKGlzb1RpbWUgPT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBjb25zdCB2YWx1ZXMgPSBpc29UaW1lLnNwbGl0KFwiOlwiKTtcclxuICAgICAgICBjb25zdCBob3VyU2Vjb25kcyA9IE51bWJlcih2YWx1ZXNbMF0pICogVGltZUNlbGwuU0VDT05EU19JTl9IT1VSO1xyXG4gICAgICAgIGNvbnN0IG1pbnV0ZVNlY29uZHMgPSBOdW1iZXIodmFsdWVzWzFdKSAqIFRpbWVDZWxsLlNFQ09ORFNfSU5fTUlOVVRFO1xyXG4gICAgICAgIGNvbnN0IHNlY29uZHMgPSBOdW1iZXIodmFsdWVzWzJdKTtcclxuICAgICAgICBjb25zdCB0b3RhbFNlY29uZHMgPSBob3VyU2Vjb25kcyArIG1pbnV0ZVNlY29uZHMgKyBzZWNvbmRzO1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gdG90YWxTZWNvbmRzIC8gVGltZUNlbGwuU0VDT05EU19JTl9EQVk7XHJcblxyXG4gICAgICAgIHRoaXMudiA9IHZhbHVlO1xyXG4gICAgICAgIHRoaXMudCA9ICduJztcclxuICAgICAgICB0aGlzLnogPSBmb3JtYXQ7XHJcbiAgICB9XHJcblxyXG4gICAgdjogYW55O1xyXG4gICAgdzogc3RyaW5nO1xyXG4gICAgdDogc3RyaW5nO1xyXG4gICAgZjogc3RyaW5nO1xyXG4gICAgRjogc3RyaW5nO1xyXG4gICAgcjogc3RyaW5nO1xyXG4gICAgaDogc3RyaW5nO1xyXG4gICAgYzogc3RyaW5nO1xyXG4gICAgejogc3RyaW5nO1xyXG4gICAgbDogc3RyaW5nO1xyXG4gICAgczogc3RyaW5nO1xyXG59XHJcblxyXG5jbGFzcyBOdW1iZXJDZWxsIGltcGxlbWVudHMgSUNlbGwge1xyXG4gICAgY29uc3RydWN0b3IodmFsdWU/OiBhbnkpIHtcclxuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLnYgPSB2YWx1ZTtcclxuICAgICAgICB0aGlzLnQgPSAnbic7XHJcbiAgICB9XHJcblxyXG4gICAgdjogYW55O1xyXG4gICAgdzogc3RyaW5nO1xyXG4gICAgdDogc3RyaW5nO1xyXG4gICAgZjogc3RyaW5nO1xyXG4gICAgRjogc3RyaW5nO1xyXG4gICAgcjogc3RyaW5nO1xyXG4gICAgaDogc3RyaW5nO1xyXG4gICAgYzogc3RyaW5nO1xyXG4gICAgejogc3RyaW5nO1xyXG4gICAgbDogc3RyaW5nO1xyXG4gICAgczogc3RyaW5nO1xyXG59XHJcblxyXG5jbGFzcyBTdHJpbmdDZWxsIGltcGxlbWVudHMgSUNlbGwge1xyXG4gICAgY29uc3RydWN0b3IodmFsdWU/OiBhbnkpIHtcclxuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLnYgPSB2YWx1ZTtcclxuICAgICAgICB0aGlzLnQgPSAncyc7XHJcbiAgICB9XHJcblxyXG4gICAgdjogYW55O1xyXG4gICAgdzogc3RyaW5nO1xyXG4gICAgdDogc3RyaW5nO1xyXG4gICAgZjogc3RyaW5nO1xyXG4gICAgRjogc3RyaW5nO1xyXG4gICAgcjogc3RyaW5nO1xyXG4gICAgaDogc3RyaW5nO1xyXG4gICAgYzogc3RyaW5nO1xyXG4gICAgejogc3RyaW5nO1xyXG4gICAgbDogc3RyaW5nO1xyXG4gICAgczogc3RyaW5nO1xyXG59IiwiaW50ZXJmYWNlIElXb3JrU2hlZXQge1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgc2V0Q2VsbChyb3c6IG51bWJlciwgY29sOiBudW1iZXIsIHZhbHVlOiBhbnksIGNlbGw/OiBJQ2VsbCk7XHJcbiAgICBnZXRDZWxsKHJvdzogbnVtYmVyLCBjb2w6IG51bWJlcik6IElDZWxsO1xyXG59XHJcblxyXG5jbGFzcyBXb3JrU2hlZXQgaW1wbGVtZW50cyBJV29ya1NoZWV0IHtcclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBuYW1lLCBwcml2YXRlIHhsc3g6IGFueSkge1xyXG4gICAgICAgIHRoaXMuX3JhbmdlID0gbmV3IENlbGxSYW5nZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3JhbmdlOiBJQ2VsbFJhbmdlO1xyXG5cclxuICAgIHNldENlbGwocm93OiBudW1iZXIsIGNvbDogbnVtYmVyLCB2YWx1ZTogYW55LCBjZWxsPzogSUNlbGwpIHtcclxuICAgICAgICB2YXIgYWRkcmVzcyA9IG5ldyBDZWxsQWRkcmVzcyhyb3csIGNvbCk7XHJcbiAgICAgICAgaWYgKCFjZWxsKVxyXG4gICAgICAgICAgICBjZWxsID0gbmV3IFN0cmluZ0NlbGwodmFsdWUpO1xyXG5cclxuICAgICAgICB2YXIgY2VsbFJlZmVyZW5jZSA9IHRoaXMueGxzeC51dGlscy5lbmNvZGVfY2VsbChhZGRyZXNzKTtcclxuICAgICAgICB0aGlzW2NlbGxSZWZlcmVuY2VdID0gY2VsbDtcclxuXHJcbiAgICAgICAgdGhpcy5fcmFuZ2UuYWRkQWRkcmVzcyhhZGRyZXNzKTtcclxuICAgICAgICB0aGlzW1wiIXJlZlwiXSA9IHRoaXMueGxzeC51dGlscy5lbmNvZGVfcmFuZ2UodGhpcy5fcmFuZ2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldENlbGwocm93OiBudW1iZXIsIGNvbDogbnVtYmVyKTogSUNlbGwge1xyXG4gICAgICAgIHZhciBhZGRyZXNzID0gbmV3IENlbGxBZGRyZXNzKHJvdywgY29sKTtcclxuICAgICAgICB2YXIgY2VsbFJlZmVyZW5jZSA9IHRoaXMueGxzeC51dGlscy5lbmNvZGVfY2VsbChhZGRyZXNzKTtcclxuICAgICAgICB2YXIgY2VsbCA9IHRoaXNbY2VsbFJlZmVyZW5jZV07XHJcbiAgICAgICAgcmV0dXJuIGNlbGw7XHJcbiAgICB9XHJcbn0iLCJpbnRlcmZhY2UgSVdvcmtCb29rIHtcclxuICAgIGFkZFdvcmtTaGVldCh3czogc3RyaW5nIHwgSVdvcmtTaGVldCk6IElXb3JrU2hlZXQ7XHJcblxyXG59XHJcblxyXG5jbGFzcyBXb3JrQm9vayBpbXBsZW1lbnRzIElXb3JrQm9vayB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHhsc3g6IGFueSkge1xyXG4gICAgICAgIHRoaXNbJ1NoZWV0TmFtZXMnXSA9IFtdO1xyXG4gICAgICAgIHRoaXNbJ1NoZWV0cyddID0ge307XHJcbiAgICB9XHJcblxyXG4gICAgYWRkV29ya1NoZWV0KHdvcmtzaGVldDogc3RyaW5nIHwgSVdvcmtTaGVldCk6IElXb3JrU2hlZXQge1xyXG4gICAgICAgIGlmICh0eXBlb2Ygd29ya3NoZWV0ID09IFwic3RyaW5nXCIpXHJcbiAgICAgICAgICAgIHdvcmtzaGVldCA9IG5ldyBXb3JrU2hlZXQod29ya3NoZWV0LCB0aGlzLnhsc3gpO1xyXG5cclxuICAgICAgICBjb25zdCBuYW1lID0gd29ya3NoZWV0Lm5hbWU7XHJcbiAgICAgICAgbGV0IHNoZWV0TmFtZXM6IHN0cmluZ1tdID0gdGhpc1snU2hlZXROYW1lcyddO1xyXG4gICAgICAgIHNoZWV0TmFtZXMucHVzaChuYW1lKTtcclxuICAgICAgICB0aGlzWydTaGVldHMnXVtuYW1lXSA9IHdvcmtzaGVldDtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gd29ya3NoZWV0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3NoZWV0TmFtZXM6IHN0cmluZ1tdO1xyXG4gICAgcHJpdmF0ZSBfc2hlZXRzOiBzdHJpbmdbXVtdO1xyXG59IiwiaW50ZXJmYWNlIElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgIGFkZFRpbWVDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55LCBmb3JtYXQ/OiBzdHJpbmcpOiBJV29ya1NoZWV0QnVpbGRlcjxUPlxyXG4gICAgYWRkRGF0ZUNvbHVtbihuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246ICh4OiBUKSA9PiBhbnkpOiBJV29ya1NoZWV0QnVpbGRlcjxUPjtcclxuICAgIGFkZE51bWJlckNvbHVtbihuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246ICh4OiBUKSA9PiBhbnkpOiBJV29ya1NoZWV0QnVpbGRlcjxUPlxyXG4gICAgYWRkQ3VycmVuY3lDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55LCBnZXRDdXJyZW5jeT86ICh4OiBUKSA9PiBzdHJpbmcpOiBJV29ya1NoZWV0QnVpbGRlcjxUPlxyXG4gICAgYWRkQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSwgY3JlYXRlQ2VsbD86ICh4OiBhbnkpID0+IElDZWxsKTogSVdvcmtTaGVldEJ1aWxkZXI8VD47XHJcbiAgICBzZXROYW1lKG5hbWU6IHN0cmluZyk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+O1xyXG4gICAgc2V0VGltZVpvbmUodGltZVpvbmU6IHN0cmluZyk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+O1xyXG4gICAgc2V0Q3VycmVuY3koY3VycmVuY3lGb3JtYXQ6IHN0cmluZyk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+O1xyXG4gICAgYnVpbGQoKTogSVdvcmtTaGVldDtcclxufVxyXG5cclxuY2xhc3MgV29ya1NoZWV0QnVpbGRlcjxUPiBpbXBsZW1lbnRzIElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIHByaXZhdGUgeGxzeDogYW55LFxyXG4gICAgICAgIHByaXZhdGUgbW9tZW50OiBhbnksXHJcbiAgICAgICAgcHJpdmF0ZSBjdXJyZW5jeTogYW55LFxyXG4gICAgICAgIHByaXZhdGUgYWNjb3VudGluZzogYW55LFxyXG4gICAgICAgIHByaXZhdGUgdmFsdWVzOiBUW11cclxuICAgICkge1xyXG4gICAgICAgIHRoaXMuY29sdW1ucyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFRpbWVDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55LCBmb3JtYXQ/OiBzdHJpbmcpOiBJV29ya1NoZWV0QnVpbGRlcjxUPiB7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5zLnB1c2goeyBuYW1lOiBuYW1lLCBleHByZXNzaW9uOiBleHByZXNzaW9uLCBjcmVhdGVDZWxsOiB4ID0+IG5ldyBUaW1lQ2VsbCh4LCBmb3JtYXQpIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZERhdGVDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55KTogSVdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgICAgIHRoaXMuY29sdW1ucy5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogbmFtZSxcclxuICAgICAgICAgICAgZXhwcmVzc2lvbjogZXhwcmVzc2lvbixcclxuICAgICAgICAgICAgY3JlYXRlQ2VsbDogeCA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSAhdGhpcy50aW1lWm9uZSA/IHggOiB0aGlzLm1vbWVudCh4LCAnWVlZWS1NTS1ERCcpLnR6KHRoaXMudGltZVpvbmUpLmZvcm1hdCgnWVlZWS1NTS1ERCBISDptbTpzcycpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRlQ2VsbCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBhZGROdW1iZXJDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55KTogSVdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgICAgIHRoaXMuY29sdW1ucy5wdXNoKHsgbmFtZTogbmFtZSwgZXhwcmVzc2lvbjogZXhwcmVzc2lvbiwgY3JlYXRlQ2VsbDogeCA9PiBuZXcgTnVtYmVyQ2VsbCh4KSB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldEN1cnJlbmN5Rm9ybWF0KGN1cnJlbmN5OiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbmN5U3ltYm9sID0gdGhpcy5jdXJyZW5jeS5zeW1ib2xpemUoY3VycmVuY3kpO1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbmN5U2V0dGluZ3MgPSB0aGlzLmFjY291bnRpbmcuc2V0dGluZ3MuY3VycmVuY3k7XHJcbiAgICAgICAgdmFyIGN1cnJlbmN5Rm9ybWF0ID0gYCR7Y3VycmVuY3lTeW1ib2x9IyR7Y3VycmVuY3lTZXR0aW5ncy50aG91c2FuZH0jIzAke2N1cnJlbmN5U2V0dGluZ3MuZGVjaW1hbH0wMGA7XHJcbiAgICAgICAgcmV0dXJuIGN1cnJlbmN5Rm9ybWF0O1xyXG4gICAgfVxyXG5cclxuICAgIGFkZEN1cnJlbmN5Q29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSwgZ2V0Q3VycmVuY3k/OiAoeDogVCkgPT4gc3RyaW5nKTogSVdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgICAgIHRoaXMuY29sdW1ucy5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogbmFtZSwgZXhwcmVzc2lvbjogZXhwcmVzc2lvbiwgY3JlYXRlQ2VsbDogKHZhbHVlLCB4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm9ybWF0ID0gZ2V0Q3VycmVuY3kgPyB0aGlzLmdldEN1cnJlbmN5Rm9ybWF0KGdldEN1cnJlbmN5KHgpKSA6IHRoaXMuY3VycmVuY3lGb3JtYXQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEN1cnJlbmN5Q2VsbCh2YWx1ZSwgZm9ybWF0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZENvbHVtbihuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246ICh4OiBUKSA9PiBhbnksIGNyZWF0ZUNlbGw/OiAoeDogYW55KSA9PiBJQ2VsbCk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgICAgICB0aGlzLmNvbHVtbnMucHVzaCh7IG5hbWU6IG5hbWUsIGV4cHJlc3Npb246IGV4cHJlc3Npb24sIGNyZWF0ZUNlbGw6IGNyZWF0ZUNlbGwgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0VGltZVpvbmUodGltZVpvbmU6IHN0cmluZyk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgICAgICB0aGlzLnRpbWVab25lID0gdGltZVpvbmU7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Q3VycmVuY3koY3VycmVuY3k6IHN0cmluZyk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgICAgICB0aGlzLmN1cnJlbmN5Rm9ybWF0ID0gdGhpcy5nZXRDdXJyZW5jeUZvcm1hdChjdXJyZW5jeSlcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBzZXROYW1lKG5hbWU6IHN0cmluZyk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGJ1aWxkKCk6IElXb3JrU2hlZXQge1xyXG4gICAgICAgIHZhciB3b3Jrc2hlZXQgPSBuZXcgV29ya1NoZWV0KHRoaXMubmFtZSwgdGhpcy54bHN4KTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgY29sSWR4ID0gMDsgY29sSWR4IDwgdGhpcy5jb2x1bW5zLmxlbmd0aDsgY29sSWR4KyspIHtcclxuICAgICAgICAgICAgbGV0IGNvbHVtbiA9IHRoaXMuY29sdW1uc1tjb2xJZHhdO1xyXG4gICAgICAgICAgICB3b3Jrc2hlZXQuc2V0Q2VsbCgwLCBjb2xJZHgsIGNvbHVtbi5uYW1lKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMudmFsdWVzLmZvckVhY2goKHgsIHJvd0lkeCkgPT4ge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBjb2xJZHggPSAwOyBjb2xJZHggPCB0aGlzLmNvbHVtbnMubGVuZ3RoOyBjb2xJZHgrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbHVtbiA9IHRoaXMuY29sdW1uc1tjb2xJZHhdO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBjb2x1bW4uZXhwcmVzc2lvbih4KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNlbGwgPSBjb2x1bW4uY3JlYXRlQ2VsbCA/IGNvbHVtbi5jcmVhdGVDZWxsKHZhbHVlLCB4KSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICB3b3Jrc2hlZXQuc2V0Q2VsbChyb3dJZHggKyAxLCBjb2xJZHgsIHZhbHVlLCBjZWxsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gd29ya3NoZWV0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgbmFtZTogc3RyaW5nO1xyXG4gICAgcHJpdmF0ZSB0aW1lWm9uZTogc3RyaW5nO1xyXG4gICAgcHJpdmF0ZSBjdXJyZW5jeUZvcm1hdDogc3RyaW5nO1xyXG4gICAgcHJpdmF0ZSBjb2x1bW5zOiB7IG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSwgY3JlYXRlQ2VsbD86ICh2YWx1ZTogYW55LCB4OiBUKSA9PiBJQ2VsbCB9W107XHJcbn0iLCJpbnRlcmZhY2UgSUV4Y2VsQ29udmVydGVyIHtcclxuICAgIGNyZWF0ZSgpOiBJV29ya0Jvb2s7XHJcbiAgICBjcmVhdGVCdWlsZGVyPFQ+KHZhbHVlczogVFtdKTogV29ya1NoZWV0QnVpbGRlcjxUPjtcclxuICAgIHNhdmVBcyhuYW1lOiBzdHJpbmcsIHdvcmtib29rOiBJV29ya0Jvb2spO1xyXG59XHJcblxyXG5jbGFzcyBFeGNlbENvbnZlcnRlciBpbXBsZW1lbnRzIElFeGNlbENvbnZlcnRlciB7XHJcblxyXG4gICAgc3RhdGljICRpbmplY3QgPSBbJ3NhdmVBcycsICdYTFNYJywgJ21vbWVudCcsICdjdXJyZW5jeScsICdhY2NvdW50aW5nJ107XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfc2F2ZUFzOiBhbnksIHByaXZhdGUgeGxzeDogYW55LCBwcml2YXRlIG1vbWVudDogYW55LCBwcml2YXRlIGN1cnJlbmN5OiBhbnksIHByaXZhdGUgYWNjb3VudGluZzogYW55KSB7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGNyZWF0ZSgpOiBJV29ya0Jvb2sge1xyXG4gICAgICAgIHZhciB3YiA9IG5ldyBXb3JrQm9vayh0aGlzLnhsc3gpO1xyXG4gICAgICAgIHJldHVybiB3YjtcclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVCdWlsZGVyPFQ+KHZhbHVlczogVFtdKTogV29ya1NoZWV0QnVpbGRlcjxUPiB7XHJcbiAgICAgICAgY29uc3QgYnVpbGRlciA9IG5ldyBXb3JrU2hlZXRCdWlsZGVyKHRoaXMueGxzeCwgdGhpcy5tb21lbnQsIHRoaXMuY3VycmVuY3ksIHRoaXMuYWNjb3VudGluZywgdmFsdWVzKTtcclxuICAgICAgICByZXR1cm4gYnVpbGRlcjtcclxuICAgIH1cclxuXHJcbiAgICBzYXZlQXMobmFtZTogc3RyaW5nLCB3b3JrYm9vazogSVdvcmtCb29rKSB7XHJcbiAgICAgICAgdmFyIHdib3V0ID0gdGhpcy54bHN4LndyaXRlKHdvcmtib29rLCB7IGJvb2tUeXBlOiAneGxzeCcsIGJvb2tTU1Q6IGZhbHNlLCB0eXBlOiAnYmluYXJ5JyB9KTtcclxuICAgICAgICB2YXIgYnVmZmVyID0gdGhpcy5jb252ZXJ0VG9CaW5hcnkod2JvdXQpO1xyXG4gICAgICAgIHRoaXMuX3NhdmVBcyhuZXcgQmxvYihbYnVmZmVyXSwgeyB0eXBlOiBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiIH0pLCBgJHtuYW1lfS54bHN4YCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjb252ZXJ0VG9CaW5hcnkod29ya2Jvb2spIHtcclxuICAgICAgICB2YXIgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKHdvcmtib29rLmxlbmd0aCk7XHJcbiAgICAgICAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpICE9PSB3b3JrYm9vay5sZW5ndGg7ICsraSlcclxuICAgICAgICAgICAgdmlld1tpXSA9IHdvcmtib29rLmNoYXJDb2RlQXQoaSkgJiAweEZGO1xyXG4gICAgICAgIHJldHVybiBidWZmZXI7XHJcbiAgICB9XHJcbn1cclxuXHJcbkFuZ3VsYXIubW9kdWxlKFwiYW5ndWxhci1leGNlbFwiKS5zZXJ2aWNlKCdleGNlbENvbnZlcnRlcicsIEV4Y2VsQ29udmVydGVyKTsiXX0=