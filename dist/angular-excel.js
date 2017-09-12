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
    function DateCell(isoDate) {
        if (isoDate == null)
            return;
        this.v = isoDate;
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
        var wbout = this.xlsx.write(workbook, { bookType: 'xlsx', bookSST: true, type: 'binary' });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ndWxhci1leGNlbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9hcHAudHMiLCIuLi9zcmMvY2VsbEFkZHJlc3MudHMiLCIuLi9zcmMvY2VsbFJhbmdlLnRzIiwiLi4vc3JjL2NlbGwudHMiLCIuLi9zcmMvd29ya3NoZWV0LnRzIiwiLi4vc3JjL3dvcmtib29rLnRzIiwiLi4vc3JjL3dvcmtzaGVldEJ1aWxkZXIudHMiLCIuLi9zcmMvZXhjZWxDb252ZXJ0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBVSxLQUFLLENBYWQ7QUFiRCxXQUFVLEtBQUs7SUFPWCxPQUFPLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUM7U0FDOUIsUUFBUSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUM7U0FDMUIsUUFBUSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUM7U0FDdEIsUUFBUSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUM7U0FDMUIsUUFBUSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUM7U0FDOUIsUUFBUSxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztBQUM1QyxDQUFDLEVBYlMsS0FBSyxLQUFMLEtBQUssUUFhZDtBQ1JEO0lBQ0kscUJBQVksR0FBVyxFQUFFLEdBQVc7UUFDaEMsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDYixJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUNqQixDQUFDO0lBTUwsa0JBQUM7QUFBRCxDQUFDLEFBVkQsSUFVQztBQ1hEO0lBQ0k7UUFDSSxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksV0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMvQixJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksV0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBT0QsOEJBQVUsR0FBVixVQUFXLE9BQXFCO1FBQzVCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckIsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN6QixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFFekIsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQixJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckIsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBQ0wsZ0JBQUM7QUFBRCxDQUFDLEFBdEJELElBc0JDO0FDMUJELHNEQUFzRDtBQWdCdEQ7SUFBQTtJQVlBLENBQUM7SUFBRCxXQUFDO0FBQUQsQ0FBQyxBQVpELElBWUM7QUFFRDtJQUNJLGtCQUFZLE9BQVk7UUFDcEIsRUFBRSxDQUFDLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQztZQUNoQixNQUFNLENBQUM7UUFFWCxJQUFJLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQztRQUNqQixJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUNqQixDQUFDO0lBYUwsZUFBQztBQUFELENBQUMsQUFwQkQsSUFvQkM7QUFFRDtJQUNJLHNCQUFZLEtBQWEsRUFBRSxNQUFjO1FBQ3JDLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUM7WUFDZCxNQUFNLENBQUM7UUFFWCxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUNmLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQ2IsSUFBSSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUM7SUFDcEIsQ0FBQztJQWFMLG1CQUFDO0FBQUQsQ0FBQyxBQXJCRCxJQXFCQztBQUVEO0lBS0ksa0JBQVksT0FBZSxFQUFFLE1BQTZCO1FBQTdCLHVCQUFBLEVBQUEscUJBQTZCO1FBQ3RELEVBQUUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUM7WUFDaEIsTUFBTSxDQUFDO1FBRVgsSUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNsQyxJQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQztRQUNqRSxJQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLGlCQUFpQixDQUFDO1FBQ3JFLElBQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsQyxJQUFNLFlBQVksR0FBRyxXQUFXLEdBQUcsYUFBYSxHQUFHLE9BQU8sQ0FBQztRQUMzRCxJQUFNLEtBQUssR0FBRyxZQUFZLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQztRQUVyRCxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUNmLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQ2IsSUFBSSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUM7SUFDcEIsQ0FBQztJQWxCYyx1QkFBYyxHQUFHLEtBQUssQ0FBQztJQUN2Qix3QkFBZSxHQUFHLElBQUksQ0FBQztJQUN2QiwwQkFBaUIsR0FBRyxFQUFFLENBQUM7SUE2QjFDLGVBQUM7Q0FBQSxBQWhDRCxJQWdDQztBQUVEO0lBQ0ksb0JBQVksS0FBVztRQUNuQixFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDO1lBQ2QsTUFBTSxDQUFDO1FBRVgsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUM7UUFDZixJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUNqQixDQUFDO0lBYUwsaUJBQUM7QUFBRCxDQUFDLEFBcEJELElBb0JDO0FBRUQ7SUFDSSxvQkFBWSxLQUFXO1FBQ25CLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUM7WUFDZCxNQUFNLENBQUM7UUFFWCxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUNmLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0lBQ2pCLENBQUM7SUFhTCxpQkFBQztBQUFELENBQUMsQUFwQkQsSUFvQkM7QUNqSkQ7SUFDSSxtQkFBbUIsSUFBSSxFQUFVLElBQVM7UUFBdkIsU0FBSSxHQUFKLElBQUksQ0FBQTtRQUFVLFNBQUksR0FBSixJQUFJLENBQUs7UUFDdEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO0lBQ2xDLENBQUM7SUFJRCwyQkFBTyxHQUFQLFVBQVEsR0FBVyxFQUFFLEdBQVcsRUFBRSxLQUFVLEVBQUUsSUFBWTtRQUN0RCxJQUFJLE9BQU8sR0FBRyxJQUFJLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDeEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDTixJQUFJLEdBQUcsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFakMsSUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3pELElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxJQUFJLENBQUM7UUFFM0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDN0QsQ0FBQztJQUVELDJCQUFPLEdBQVAsVUFBUSxHQUFXLEVBQUUsR0FBVztRQUM1QixJQUFJLE9BQU8sR0FBRyxJQUFJLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDeEMsSUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3pELElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUMvQixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFDTCxnQkFBQztBQUFELENBQUMsQUF6QkQsSUF5QkM7QUMxQkQ7SUFDSSxrQkFBb0IsSUFBUztRQUFULFNBQUksR0FBSixJQUFJLENBQUs7UUFDekIsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ3hCLENBQUM7SUFFRCwrQkFBWSxHQUFaLFVBQWEsU0FBOEI7UUFDdkMsRUFBRSxDQUFDLENBQUMsT0FBTyxTQUFTLElBQUksUUFBUSxDQUFDO1lBQzdCLFNBQVMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXBELElBQU0sSUFBSSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUM7UUFDNUIsSUFBSSxVQUFVLEdBQWEsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzlDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLFNBQVMsQ0FBQztRQUVqQyxNQUFNLENBQUMsU0FBUyxDQUFDO0lBQ3JCLENBQUM7SUFJTCxlQUFDO0FBQUQsQ0FBQyxBQXBCRCxJQW9CQztBQ2REO0lBQ0ksMEJBQ1ksSUFBUyxFQUNULE1BQVcsRUFDWCxRQUFhLEVBQ2IsVUFBZSxFQUNmLE1BQVc7UUFKWCxTQUFJLEdBQUosSUFBSSxDQUFLO1FBQ1QsV0FBTSxHQUFOLE1BQU0sQ0FBSztRQUNYLGFBQVEsR0FBUixRQUFRLENBQUs7UUFDYixlQUFVLEdBQVYsVUFBVSxDQUFLO1FBQ2YsV0FBTSxHQUFOLE1BQU0sQ0FBSztRQUVuQixJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBRUQsd0NBQWEsR0FBYixVQUFjLElBQVksRUFBRSxVQUF5QixFQUFFLE1BQWU7UUFDbEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLFVBQUEsQ0FBQyxJQUFJLE9BQUEsSUFBSSxRQUFRLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxFQUF2QixDQUF1QixFQUFFLENBQUMsQ0FBQztRQUNwRyxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCx3Q0FBYSxHQUFiLFVBQWMsSUFBWSxFQUFFLFVBQXlCO1FBQ2pELElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQ2QsSUFBSSxFQUFFLElBQUk7WUFDVixVQUFVLEVBQUUsVUFBVTtZQUN0QixVQUFVLEVBQUUsVUFBQSxDQUFDLElBQUksT0FBQSxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBZixDQUFlO1NBQ25DLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVELDBDQUFlLEdBQWYsVUFBZ0IsSUFBWSxFQUFFLFVBQXlCO1FBQ25ELElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxVQUFBLENBQUMsSUFBSSxPQUFBLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFqQixDQUFpQixFQUFFLENBQUMsQ0FBQztRQUM5RixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFTyw0Q0FBaUIsR0FBekIsVUFBMEIsUUFBZ0I7UUFDdEMsSUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDekQsSUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7UUFDM0QsSUFBSSxjQUFjLEdBQU0sY0FBYyxTQUFJLGdCQUFnQixDQUFDLFFBQVEsV0FBTSxnQkFBZ0IsQ0FBQyxPQUFPLE9BQUksQ0FBQztRQUN0RyxNQUFNLENBQUMsY0FBYyxDQUFDO0lBQzFCLENBQUM7SUFFRCw0Q0FBaUIsR0FBakIsVUFBa0IsSUFBWSxFQUFFLFVBQXlCLEVBQUUsV0FBOEI7UUFBekYsaUJBUUM7UUFQRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztZQUNkLElBQUksRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsVUFBQyxLQUFLLEVBQUUsQ0FBQztnQkFDckQsSUFBSSxNQUFNLEdBQUcsV0FBVyxHQUFHLEtBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFJLENBQUMsY0FBYyxDQUFDO2dCQUN4RixNQUFNLENBQUMsSUFBSSxZQUFZLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzNDLENBQUM7U0FDSixDQUFDLENBQUM7UUFDSCxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxvQ0FBUyxHQUFULFVBQVUsSUFBWSxFQUFFLFVBQXlCLEVBQUUsVUFBOEI7UUFDN0UsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDbEYsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsc0NBQVcsR0FBWCxVQUFZLFFBQWdCO1FBQ3hCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ3RELE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVELGtDQUFPLEdBQVAsVUFBUSxJQUFZO1FBQ2hCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVELGdDQUFLLEdBQUw7UUFBQSxpQkFrQkM7UUFqQkcsSUFBSSxTQUFTLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFcEQsR0FBRyxDQUFDLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDO1lBQzFELElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbEMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBQyxDQUFDLEVBQUUsTUFBTTtZQUMxQixHQUFHLENBQUMsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFHLEtBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQzFELElBQUksTUFBTSxHQUFHLEtBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2xDLElBQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25DLElBQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO2dCQUNwRSxTQUFTLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN2RCxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsU0FBUyxDQUFDO0lBQ3JCLENBQUM7SUFLTCx1QkFBQztBQUFELENBQUMsQUFyRkQsSUFxRkM7QUMxRkQ7SUFJSSx3QkFBb0IsT0FBWSxFQUFVLElBQVMsRUFBVSxNQUFXLEVBQVUsUUFBYSxFQUFVLFVBQWU7UUFBcEcsWUFBTyxHQUFQLE9BQU8sQ0FBSztRQUFVLFNBQUksR0FBSixJQUFJLENBQUs7UUFBVSxXQUFNLEdBQU4sTUFBTSxDQUFLO1FBQVUsYUFBUSxHQUFSLFFBQVEsQ0FBSztRQUFVLGVBQVUsR0FBVixVQUFVLENBQUs7SUFFeEgsQ0FBQztJQUVELCtCQUFNLEdBQU47UUFDSSxJQUFJLEVBQUUsR0FBRyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUNkLENBQUM7SUFFRCxzQ0FBYSxHQUFiLFVBQWlCLE1BQVc7UUFDeEIsSUFBTSxPQUFPLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3JHLE1BQU0sQ0FBQyxPQUFPLENBQUM7SUFDbkIsQ0FBQztJQUVELCtCQUFNLEdBQU4sVUFBTyxJQUFZLEVBQUUsUUFBbUI7UUFDcEMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzNGLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLDBCQUEwQixFQUFFLENBQUMsRUFBSyxJQUFJLFVBQU8sQ0FBQyxDQUFDO0lBQzNGLENBQUM7SUFFTyx3Q0FBZSxHQUF2QixVQUF3QixRQUFRO1FBQzVCLElBQUksTUFBTSxHQUFHLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM5QyxJQUFJLElBQUksR0FBRyxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLFFBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO1lBQ3RDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztRQUM1QyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUE1Qk0sc0JBQU8sR0FBRyxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztJQTZCNUUscUJBQUM7Q0FBQSxBQS9CRCxJQStCQztBQUVELE9BQU8sQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLGNBQWMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsibmFtZXNwYWNlIGV4Y2VsIHtcclxuICAgIGRlY2xhcmUgdmFyIFhMU1g6IGFueTtcclxuICAgIGRlY2xhcmUgdmFyIHNhdmVBczogYW55O1xyXG4gICAgZGVjbGFyZSB2YXIgbW9tZW50OiBhbnk7XHJcbiAgICBkZWNsYXJlIHZhciBjdXJyZW5jeTogYW55O1xyXG4gICAgZGVjbGFyZSB2YXIgYWNjb3VudGluZzogYW55O1xyXG5cclxuICAgIEFuZ3VsYXIubW9kdWxlKFwiYW5ndWxhci1leGNlbFwiLCBbXSlcclxuICAgICAgICAuY29uc3RhbnQoXCJzYXZlQXNcIiwgc2F2ZUFzKVxyXG4gICAgICAgIC5jb25zdGFudChcIlhMU1hcIiwgWExTWClcclxuICAgICAgICAuY29uc3RhbnQoXCJtb21lbnRcIiwgbW9tZW50KVxyXG4gICAgICAgIC5jb25zdGFudChcImN1cnJlbmN5XCIsIGN1cnJlbmN5KVxyXG4gICAgICAgIC5jb25zdGFudChcImFjY291bnRpbmdcIiwgYWNjb3VudGluZyk7XHJcbn0iLCJpbnRlcmZhY2UgSUNlbGxBZGRyZXNzIHtcclxuICAgIGM6IG51bWJlcjtcclxuICAgIHI6IG51bWJlcjtcclxufVxyXG5cclxuY2xhc3MgQ2VsbEFkZHJlc3MgaW1wbGVtZW50cyBJQ2VsbEFkZHJlc3Mge1xyXG4gICAgY29uc3RydWN0b3Iocm93OiBudW1iZXIsIGNvbDogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5yID0gcm93O1xyXG4gICAgICAgIHRoaXMuYyA9IGNvbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyAwLWluZGV4ZWQgY29sdW1uXHJcbiAgICBjOiBudW1iZXI7XHJcbiAgICAvLyAwLWluZGV4ZWQgcm93XHJcbiAgICByOiBudW1iZXI7XHJcbn0iLCJpbnRlcmZhY2UgSUNlbGxSYW5nZSB7XHJcbiAgICBhZGRBZGRyZXNzKGFkZHJlc3M6IElDZWxsQWRkcmVzcyk7XHJcbn1cclxuXHJcbmNsYXNzIENlbGxSYW5nZSBpbXBsZW1lbnRzIElDZWxsUmFuZ2Uge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5zID0gbmV3IENlbGxBZGRyZXNzKDAsIDApO1xyXG4gICAgICAgIHRoaXMuZSA9IG5ldyBDZWxsQWRkcmVzcygwLCAwKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBzdGFydFxyXG4gICAgczogQ2VsbEFkZHJlc3M7XHJcbiAgICAvLyBlbmRcclxuICAgIGU6IENlbGxBZGRyZXNzO1xyXG5cclxuICAgIGFkZEFkZHJlc3MoYWRkcmVzczogSUNlbGxBZGRyZXNzKSB7XHJcbiAgICAgICAgaWYgKGFkZHJlc3MuciA8IHRoaXMucy5yKVxyXG4gICAgICAgICAgICB0aGlzLnMuciA9IGFkZHJlc3MucjtcclxuICAgICAgICBpZiAoYWRkcmVzcy5jIDwgdGhpcy5zLmMpXHJcbiAgICAgICAgICAgIHRoaXMucy5jID0gYWRkcmVzcy5jO1xyXG5cclxuICAgICAgICBpZiAoYWRkcmVzcy5yID4gdGhpcy5lLnIpXHJcbiAgICAgICAgICAgIHRoaXMuZS5yID0gYWRkcmVzcy5yO1xyXG4gICAgICAgIGlmIChhZGRyZXNzLmMgPiB0aGlzLmUuYylcclxuICAgICAgICAgICAgdGhpcy5lLmMgPSBhZGRyZXNzLmM7XHJcbiAgICB9XHJcbn0iLCIvLyBzZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9TaGVldEpTL2pzLXhsc3gjY2VsbC1vYmplY3RcclxuXHJcbmludGVyZmFjZSBJQ2VsbCB7XHJcbiAgICB2OiBhbnk7XHJcbiAgICB3OiBzdHJpbmc7XHJcbiAgICB0OiBzdHJpbmc7XHJcbiAgICBmOiBzdHJpbmc7XHJcbiAgICBGOiBzdHJpbmc7XHJcbiAgICByOiBzdHJpbmc7XHJcbiAgICBoOiBzdHJpbmc7XHJcbiAgICBjOiBzdHJpbmc7XHJcbiAgICB6OiBzdHJpbmc7XHJcbiAgICBsOiBzdHJpbmc7XHJcbiAgICBzOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNsYXNzIENlbGwgaW1wbGVtZW50cyBJQ2VsbCB7XHJcbiAgICB2OiBhbnk7XHJcbiAgICB3OiBzdHJpbmc7XHJcbiAgICB0OiBzdHJpbmc7XHJcbiAgICBmOiBzdHJpbmc7XHJcbiAgICBGOiBzdHJpbmc7XHJcbiAgICByOiBzdHJpbmc7XHJcbiAgICBoOiBzdHJpbmc7XHJcbiAgICBjOiBzdHJpbmc7XHJcbiAgICB6OiBzdHJpbmc7XHJcbiAgICBsOiBzdHJpbmc7XHJcbiAgICBzOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNsYXNzIERhdGVDZWxsIGltcGxlbWVudHMgSUNlbGwge1xyXG4gICAgY29uc3RydWN0b3IoaXNvRGF0ZTogYW55KSB7XHJcbiAgICAgICAgaWYgKGlzb0RhdGUgPT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLnYgPSBpc29EYXRlO1xyXG4gICAgICAgIHRoaXMudCA9ICdkJztcclxuICAgIH1cclxuXHJcbiAgICB2OiBhbnk7XHJcbiAgICB3OiBzdHJpbmc7XHJcbiAgICB0OiBzdHJpbmc7XHJcbiAgICBmOiBzdHJpbmc7XHJcbiAgICBGOiBzdHJpbmc7XHJcbiAgICByOiBzdHJpbmc7XHJcbiAgICBoOiBzdHJpbmc7XHJcbiAgICBjOiBzdHJpbmc7XHJcbiAgICB6OiBzdHJpbmc7XHJcbiAgICBsOiBzdHJpbmc7XHJcbiAgICBzOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNsYXNzIEN1cnJlbmN5Q2VsbCBpbXBsZW1lbnRzIElDZWxsIHtcclxuICAgIGNvbnN0cnVjdG9yKHZhbHVlOiBzdHJpbmcsIGZvcm1hdDogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKHZhbHVlID09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy52ID0gdmFsdWU7XHJcbiAgICAgICAgdGhpcy50ID0gJ24nO1xyXG4gICAgICAgIHRoaXMueiA9IGZvcm1hdDtcclxuICAgIH1cclxuXHJcbiAgICB2OiBhbnk7XHJcbiAgICB3OiBzdHJpbmc7XHJcbiAgICB0OiBzdHJpbmc7XHJcbiAgICBmOiBzdHJpbmc7XHJcbiAgICBGOiBzdHJpbmc7XHJcbiAgICByOiBzdHJpbmc7XHJcbiAgICBoOiBzdHJpbmc7XHJcbiAgICBjOiBzdHJpbmc7XHJcbiAgICB6OiBzdHJpbmc7XHJcbiAgICBsOiBzdHJpbmc7XHJcbiAgICBzOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNsYXNzIFRpbWVDZWxsIGltcGxlbWVudHMgSUNlbGwge1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgU0VDT05EU19JTl9EQVkgPSA4NjQwMDtcclxuICAgIHByaXZhdGUgc3RhdGljIFNFQ09ORFNfSU5fSE9VUiA9IDM2MDA7XHJcbiAgICBwcml2YXRlIHN0YXRpYyBTRUNPTkRTX0lOX01JTlVURSA9IDYwO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGlzb1RpbWU6IHN0cmluZywgZm9ybWF0OiBzdHJpbmcgPSBcImg6bW0gQU0vUE1cIikge1xyXG4gICAgICAgIGlmIChpc29UaW1lID09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgY29uc3QgdmFsdWVzID0gaXNvVGltZS5zcGxpdChcIjpcIik7XHJcbiAgICAgICAgY29uc3QgaG91clNlY29uZHMgPSBOdW1iZXIodmFsdWVzWzBdKSAqIFRpbWVDZWxsLlNFQ09ORFNfSU5fSE9VUjtcclxuICAgICAgICBjb25zdCBtaW51dGVTZWNvbmRzID0gTnVtYmVyKHZhbHVlc1sxXSkgKiBUaW1lQ2VsbC5TRUNPTkRTX0lOX01JTlVURTtcclxuICAgICAgICBjb25zdCBzZWNvbmRzID0gTnVtYmVyKHZhbHVlc1syXSk7XHJcbiAgICAgICAgY29uc3QgdG90YWxTZWNvbmRzID0gaG91clNlY29uZHMgKyBtaW51dGVTZWNvbmRzICsgc2Vjb25kcztcclxuICAgICAgICBjb25zdCB2YWx1ZSA9IHRvdGFsU2Vjb25kcyAvIFRpbWVDZWxsLlNFQ09ORFNfSU5fREFZO1xyXG5cclxuICAgICAgICB0aGlzLnYgPSB2YWx1ZTtcclxuICAgICAgICB0aGlzLnQgPSAnbic7XHJcbiAgICAgICAgdGhpcy56ID0gZm9ybWF0O1xyXG4gICAgfVxyXG5cclxuICAgIHY6IGFueTtcclxuICAgIHc6IHN0cmluZztcclxuICAgIHQ6IHN0cmluZztcclxuICAgIGY6IHN0cmluZztcclxuICAgIEY6IHN0cmluZztcclxuICAgIHI6IHN0cmluZztcclxuICAgIGg6IHN0cmluZztcclxuICAgIGM6IHN0cmluZztcclxuICAgIHo6IHN0cmluZztcclxuICAgIGw6IHN0cmluZztcclxuICAgIHM6IHN0cmluZztcclxufVxyXG5cclxuY2xhc3MgTnVtYmVyQ2VsbCBpbXBsZW1lbnRzIElDZWxsIHtcclxuICAgIGNvbnN0cnVjdG9yKHZhbHVlPzogYW55KSB7XHJcbiAgICAgICAgaWYgKHZhbHVlID09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy52ID0gdmFsdWU7XHJcbiAgICAgICAgdGhpcy50ID0gJ24nO1xyXG4gICAgfVxyXG5cclxuICAgIHY6IGFueTtcclxuICAgIHc6IHN0cmluZztcclxuICAgIHQ6IHN0cmluZztcclxuICAgIGY6IHN0cmluZztcclxuICAgIEY6IHN0cmluZztcclxuICAgIHI6IHN0cmluZztcclxuICAgIGg6IHN0cmluZztcclxuICAgIGM6IHN0cmluZztcclxuICAgIHo6IHN0cmluZztcclxuICAgIGw6IHN0cmluZztcclxuICAgIHM6IHN0cmluZztcclxufVxyXG5cclxuY2xhc3MgU3RyaW5nQ2VsbCBpbXBsZW1lbnRzIElDZWxsIHtcclxuICAgIGNvbnN0cnVjdG9yKHZhbHVlPzogYW55KSB7XHJcbiAgICAgICAgaWYgKHZhbHVlID09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy52ID0gdmFsdWU7XHJcbiAgICAgICAgdGhpcy50ID0gJ3MnO1xyXG4gICAgfVxyXG5cclxuICAgIHY6IGFueTtcclxuICAgIHc6IHN0cmluZztcclxuICAgIHQ6IHN0cmluZztcclxuICAgIGY6IHN0cmluZztcclxuICAgIEY6IHN0cmluZztcclxuICAgIHI6IHN0cmluZztcclxuICAgIGg6IHN0cmluZztcclxuICAgIGM6IHN0cmluZztcclxuICAgIHo6IHN0cmluZztcclxuICAgIGw6IHN0cmluZztcclxuICAgIHM6IHN0cmluZztcclxufSIsImludGVyZmFjZSBJV29ya1NoZWV0IHtcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIHNldENlbGwocm93OiBudW1iZXIsIGNvbDogbnVtYmVyLCB2YWx1ZTogYW55LCBjZWxsPzogSUNlbGwpO1xyXG4gICAgZ2V0Q2VsbChyb3c6IG51bWJlciwgY29sOiBudW1iZXIpOiBJQ2VsbDtcclxufVxyXG5cclxuY2xhc3MgV29ya1NoZWV0IGltcGxlbWVudHMgSVdvcmtTaGVldCB7XHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZSwgcHJpdmF0ZSB4bHN4OiBhbnkpIHtcclxuICAgICAgICB0aGlzLl9yYW5nZSA9IG5ldyBDZWxsUmFuZ2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9yYW5nZTogSUNlbGxSYW5nZTtcclxuXHJcbiAgICBzZXRDZWxsKHJvdzogbnVtYmVyLCBjb2w6IG51bWJlciwgdmFsdWU6IGFueSwgY2VsbD86IElDZWxsKSB7XHJcbiAgICAgICAgdmFyIGFkZHJlc3MgPSBuZXcgQ2VsbEFkZHJlc3Mocm93LCBjb2wpO1xyXG4gICAgICAgIGlmICghY2VsbClcclxuICAgICAgICAgICAgY2VsbCA9IG5ldyBTdHJpbmdDZWxsKHZhbHVlKTtcclxuXHJcbiAgICAgICAgdmFyIGNlbGxSZWZlcmVuY2UgPSB0aGlzLnhsc3gudXRpbHMuZW5jb2RlX2NlbGwoYWRkcmVzcyk7XHJcbiAgICAgICAgdGhpc1tjZWxsUmVmZXJlbmNlXSA9IGNlbGw7XHJcblxyXG4gICAgICAgIHRoaXMuX3JhbmdlLmFkZEFkZHJlc3MoYWRkcmVzcyk7XHJcbiAgICAgICAgdGhpc1tcIiFyZWZcIl0gPSB0aGlzLnhsc3gudXRpbHMuZW5jb2RlX3JhbmdlKHRoaXMuX3JhbmdlKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRDZWxsKHJvdzogbnVtYmVyLCBjb2w6IG51bWJlcik6IElDZWxsIHtcclxuICAgICAgICB2YXIgYWRkcmVzcyA9IG5ldyBDZWxsQWRkcmVzcyhyb3csIGNvbCk7XHJcbiAgICAgICAgdmFyIGNlbGxSZWZlcmVuY2UgPSB0aGlzLnhsc3gudXRpbHMuZW5jb2RlX2NlbGwoYWRkcmVzcyk7XHJcbiAgICAgICAgdmFyIGNlbGwgPSB0aGlzW2NlbGxSZWZlcmVuY2VdO1xyXG4gICAgICAgIHJldHVybiBjZWxsO1xyXG4gICAgfVxyXG59IiwiaW50ZXJmYWNlIElXb3JrQm9vayB7XHJcbiAgICBhZGRXb3JrU2hlZXQod3M6IHN0cmluZyB8IElXb3JrU2hlZXQpOiBJV29ya1NoZWV0O1xyXG5cclxufVxyXG5cclxuY2xhc3MgV29ya0Jvb2sgaW1wbGVtZW50cyBJV29ya0Jvb2sge1xyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSB4bHN4OiBhbnkpIHtcclxuICAgICAgICB0aGlzWydTaGVldE5hbWVzJ10gPSBbXTtcclxuICAgICAgICB0aGlzWydTaGVldHMnXSA9IHt9O1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFdvcmtTaGVldCh3b3Jrc2hlZXQ6IHN0cmluZyB8IElXb3JrU2hlZXQpOiBJV29ya1NoZWV0IHtcclxuICAgICAgICBpZiAodHlwZW9mIHdvcmtzaGVldCA9PSBcInN0cmluZ1wiKVxyXG4gICAgICAgICAgICB3b3Jrc2hlZXQgPSBuZXcgV29ya1NoZWV0KHdvcmtzaGVldCwgdGhpcy54bHN4KTtcclxuXHJcbiAgICAgICAgY29uc3QgbmFtZSA9IHdvcmtzaGVldC5uYW1lO1xyXG4gICAgICAgIGxldCBzaGVldE5hbWVzOiBzdHJpbmdbXSA9IHRoaXNbJ1NoZWV0TmFtZXMnXTtcclxuICAgICAgICBzaGVldE5hbWVzLnB1c2gobmFtZSk7XHJcbiAgICAgICAgdGhpc1snU2hlZXRzJ11bbmFtZV0gPSB3b3Jrc2hlZXQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHdvcmtzaGVldDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9zaGVldE5hbWVzOiBzdHJpbmdbXTtcclxuICAgIHByaXZhdGUgX3NoZWV0czogc3RyaW5nW11bXTtcclxufSIsImludGVyZmFjZSBJV29ya1NoZWV0QnVpbGRlcjxUPiB7XHJcbiAgICBhZGRUaW1lQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSwgZm9ybWF0Pzogc3RyaW5nKTogSVdvcmtTaGVldEJ1aWxkZXI8VD5cclxuICAgIGFkZERhdGVDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55KTogSVdvcmtTaGVldEJ1aWxkZXI8VD47XHJcbiAgICBhZGROdW1iZXJDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55KTogSVdvcmtTaGVldEJ1aWxkZXI8VD5cclxuICAgIGFkZEN1cnJlbmN5Q29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSwgZ2V0Q3VycmVuY3k/OiAoeDogVCkgPT4gc3RyaW5nKTogSVdvcmtTaGVldEJ1aWxkZXI8VD5cclxuICAgIGFkZENvbHVtbihuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246ICh4OiBUKSA9PiBhbnksIGNyZWF0ZUNlbGw/OiAoeDogYW55KSA9PiBJQ2VsbCk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+O1xyXG4gICAgc2V0TmFtZShuYW1lOiBzdHJpbmcpOiBJV29ya1NoZWV0QnVpbGRlcjxUPjtcclxuICAgIHNldEN1cnJlbmN5KGN1cnJlbmN5Rm9ybWF0OiBzdHJpbmcpOiBJV29ya1NoZWV0QnVpbGRlcjxUPjtcclxuICAgIGJ1aWxkKCk6IElXb3JrU2hlZXQ7XHJcbn1cclxuXHJcbmNsYXNzIFdvcmtTaGVldEJ1aWxkZXI8VD4gaW1wbGVtZW50cyBJV29ya1NoZWV0QnVpbGRlcjxUPiB7XHJcbiAgICBjb25zdHJ1Y3RvcihcclxuICAgICAgICBwcml2YXRlIHhsc3g6IGFueSxcclxuICAgICAgICBwcml2YXRlIG1vbWVudDogYW55LFxyXG4gICAgICAgIHByaXZhdGUgY3VycmVuY3k6IGFueSxcclxuICAgICAgICBwcml2YXRlIGFjY291bnRpbmc6IGFueSxcclxuICAgICAgICBwcml2YXRlIHZhbHVlczogVFtdXHJcbiAgICApIHtcclxuICAgICAgICB0aGlzLmNvbHVtbnMgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRUaW1lQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSwgZm9ybWF0Pzogc3RyaW5nKTogSVdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgICAgIHRoaXMuY29sdW1ucy5wdXNoKHsgbmFtZTogbmFtZSwgZXhwcmVzc2lvbjogZXhwcmVzc2lvbiwgY3JlYXRlQ2VsbDogeCA9PiBuZXcgVGltZUNlbGwoeCwgZm9ybWF0KSB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBhZGREYXRlQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgICAgICB0aGlzLmNvbHVtbnMucHVzaCh7XHJcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXHJcbiAgICAgICAgICAgIGV4cHJlc3Npb246IGV4cHJlc3Npb24sXHJcbiAgICAgICAgICAgIGNyZWF0ZUNlbGw6IHggPT4gbmV3IERhdGVDZWxsKHgpXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkTnVtYmVyQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgICAgICB0aGlzLmNvbHVtbnMucHVzaCh7IG5hbWU6IG5hbWUsIGV4cHJlc3Npb246IGV4cHJlc3Npb24sIGNyZWF0ZUNlbGw6IHggPT4gbmV3IE51bWJlckNlbGwoeCkgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRDdXJyZW5jeUZvcm1hdChjdXJyZW5jeTogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgICAgICBjb25zdCBjdXJyZW5jeVN5bWJvbCA9IHRoaXMuY3VycmVuY3kuc3ltYm9saXplKGN1cnJlbmN5KTtcclxuICAgICAgICBjb25zdCBjdXJyZW5jeVNldHRpbmdzID0gdGhpcy5hY2NvdW50aW5nLnNldHRpbmdzLmN1cnJlbmN5O1xyXG4gICAgICAgIHZhciBjdXJyZW5jeUZvcm1hdCA9IGAke2N1cnJlbmN5U3ltYm9sfSMke2N1cnJlbmN5U2V0dGluZ3MudGhvdXNhbmR9IyMwJHtjdXJyZW5jeVNldHRpbmdzLmRlY2ltYWx9MDBgO1xyXG4gICAgICAgIHJldHVybiBjdXJyZW5jeUZvcm1hdDtcclxuICAgIH1cclxuXHJcbiAgICBhZGRDdXJyZW5jeUNvbHVtbihuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246ICh4OiBUKSA9PiBhbnksIGdldEN1cnJlbmN5PzogKHg6IFQpID0+IHN0cmluZyk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgICAgICB0aGlzLmNvbHVtbnMucHVzaCh7XHJcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsIGV4cHJlc3Npb246IGV4cHJlc3Npb24sIGNyZWF0ZUNlbGw6ICh2YWx1ZSwgeCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvcm1hdCA9IGdldEN1cnJlbmN5ID8gdGhpcy5nZXRDdXJyZW5jeUZvcm1hdChnZXRDdXJyZW5jeSh4KSkgOiB0aGlzLmN1cnJlbmN5Rm9ybWF0O1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBDdXJyZW5jeUNlbGwodmFsdWUsIGZvcm1hdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBhZGRDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55LCBjcmVhdGVDZWxsPzogKHg6IGFueSkgPT4gSUNlbGwpOiBJV29ya1NoZWV0QnVpbGRlcjxUPiB7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5zLnB1c2goeyBuYW1lOiBuYW1lLCBleHByZXNzaW9uOiBleHByZXNzaW9uLCBjcmVhdGVDZWxsOiBjcmVhdGVDZWxsIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHNldEN1cnJlbmN5KGN1cnJlbmN5OiBzdHJpbmcpOiBJV29ya1NoZWV0QnVpbGRlcjxUPiB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW5jeUZvcm1hdCA9IHRoaXMuZ2V0Q3VycmVuY3lGb3JtYXQoY3VycmVuY3kpXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0TmFtZShuYW1lOiBzdHJpbmcpOiBJV29ya1NoZWV0QnVpbGRlcjxUPiB7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBidWlsZCgpOiBJV29ya1NoZWV0IHtcclxuICAgICAgICB2YXIgd29ya3NoZWV0ID0gbmV3IFdvcmtTaGVldCh0aGlzLm5hbWUsIHRoaXMueGxzeCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGNvbElkeCA9IDA7IGNvbElkeCA8IHRoaXMuY29sdW1ucy5sZW5ndGg7IGNvbElkeCsrKSB7XHJcbiAgICAgICAgICAgIGxldCBjb2x1bW4gPSB0aGlzLmNvbHVtbnNbY29sSWR4XTtcclxuICAgICAgICAgICAgd29ya3NoZWV0LnNldENlbGwoMCwgY29sSWR4LCBjb2x1bW4ubmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnZhbHVlcy5mb3JFYWNoKCh4LCByb3dJZHgpID0+IHtcclxuICAgICAgICAgICAgZm9yIChsZXQgY29sSWR4ID0gMDsgY29sSWR4IDwgdGhpcy5jb2x1bW5zLmxlbmd0aDsgY29sSWR4KyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb2x1bW4gPSB0aGlzLmNvbHVtbnNbY29sSWR4XTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gY29sdW1uLmV4cHJlc3Npb24oeCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjZWxsID0gY29sdW1uLmNyZWF0ZUNlbGwgPyBjb2x1bW4uY3JlYXRlQ2VsbCh2YWx1ZSwgeCkgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgd29ya3NoZWV0LnNldENlbGwocm93SWR4ICsgMSwgY29sSWR4LCB2YWx1ZSwgY2VsbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHdvcmtzaGVldDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG5hbWU6IHN0cmluZztcclxuICAgIHByaXZhdGUgY3VycmVuY3lGb3JtYXQ6IHN0cmluZztcclxuICAgIHByaXZhdGUgY29sdW1uczogeyBuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246ICh4OiBUKSA9PiBhbnksIGNyZWF0ZUNlbGw/OiAodmFsdWU6IGFueSwgeDogVCkgPT4gSUNlbGwgfVtdO1xyXG59IiwiaW50ZXJmYWNlIElFeGNlbENvbnZlcnRlciB7XHJcbiAgICBjcmVhdGUoKTogSVdvcmtCb29rO1xyXG4gICAgY3JlYXRlQnVpbGRlcjxUPih2YWx1ZXM6IFRbXSk6IFdvcmtTaGVldEJ1aWxkZXI8VD47XHJcbiAgICBzYXZlQXMobmFtZTogc3RyaW5nLCB3b3JrYm9vazogSVdvcmtCb29rKTtcclxufVxyXG5cclxuY2xhc3MgRXhjZWxDb252ZXJ0ZXIgaW1wbGVtZW50cyBJRXhjZWxDb252ZXJ0ZXIge1xyXG5cclxuICAgIHN0YXRpYyAkaW5qZWN0ID0gWydzYXZlQXMnLCAnWExTWCcsICdtb21lbnQnLCAnY3VycmVuY3knLCAnYWNjb3VudGluZyddO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX3NhdmVBczogYW55LCBwcml2YXRlIHhsc3g6IGFueSwgcHJpdmF0ZSBtb21lbnQ6IGFueSwgcHJpdmF0ZSBjdXJyZW5jeTogYW55LCBwcml2YXRlIGFjY291bnRpbmc6IGFueSkge1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGUoKTogSVdvcmtCb29rIHtcclxuICAgICAgICB2YXIgd2IgPSBuZXcgV29ya0Jvb2sodGhpcy54bHN4KTtcclxuICAgICAgICByZXR1cm4gd2I7XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlQnVpbGRlcjxUPih2YWx1ZXM6IFRbXSk6IFdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgICAgIGNvbnN0IGJ1aWxkZXIgPSBuZXcgV29ya1NoZWV0QnVpbGRlcih0aGlzLnhsc3gsIHRoaXMubW9tZW50LCB0aGlzLmN1cnJlbmN5LCB0aGlzLmFjY291bnRpbmcsIHZhbHVlcyk7XHJcbiAgICAgICAgcmV0dXJuIGJ1aWxkZXI7XHJcbiAgICB9XHJcblxyXG4gICAgc2F2ZUFzKG5hbWU6IHN0cmluZywgd29ya2Jvb2s6IElXb3JrQm9vaykge1xyXG4gICAgICAgIHZhciB3Ym91dCA9IHRoaXMueGxzeC53cml0ZSh3b3JrYm9vaywgeyBib29rVHlwZTogJ3hsc3gnLCBib29rU1NUOiB0cnVlLCB0eXBlOiAnYmluYXJ5JyB9KTtcclxuICAgICAgICB2YXIgYnVmZmVyID0gdGhpcy5jb252ZXJ0VG9CaW5hcnkod2JvdXQpO1xyXG4gICAgICAgIHRoaXMuX3NhdmVBcyhuZXcgQmxvYihbYnVmZmVyXSwgeyB0eXBlOiBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiIH0pLCBgJHtuYW1lfS54bHN4YCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjb252ZXJ0VG9CaW5hcnkod29ya2Jvb2spIHtcclxuICAgICAgICB2YXIgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKHdvcmtib29rLmxlbmd0aCk7XHJcbiAgICAgICAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpICE9PSB3b3JrYm9vay5sZW5ndGg7ICsraSlcclxuICAgICAgICAgICAgdmlld1tpXSA9IHdvcmtib29rLmNoYXJDb2RlQXQoaSkgJiAweEZGO1xyXG4gICAgICAgIHJldHVybiBidWZmZXI7XHJcbiAgICB9XHJcbn1cclxuXHJcbkFuZ3VsYXIubW9kdWxlKFwiYW5ndWxhci1leGNlbFwiKS5zZXJ2aWNlKCdleGNlbENvbnZlcnRlcicsIEV4Y2VsQ29udmVydGVyKTsiXX0=