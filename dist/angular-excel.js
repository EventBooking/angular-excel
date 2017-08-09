var excel;
(function (excel) {
    Angular.module("angular-excel", [])
        .constant("saveAs", saveAs)
        .constant("XLSX", XLSX);
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
    function DateCell(value, formattedText) {
        if (value == null)
            return;
        this.v = value;
        this.t = 'd';
        this.w = formattedText;
    }
    return DateCell;
}());
var StringCell = (function () {
    function StringCell(value, formattedText) {
        if (value == null)
            return;
        this.v = value;
        this.t = 's';
        this.w = formattedText;
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
    function WorkSheetBuilder(xlsx, values) {
        this.xlsx = xlsx;
        this.values = values;
        this.columns = [];
    }
    WorkSheetBuilder.prototype.addDateColumn = function (name, expression) {
        this.columns.push({ name: name, expression: expression, createCell: function (x) { return new DateCell(x); } });
        return this;
    };
    WorkSheetBuilder.prototype.addColumn = function (name, expression, createCell) {
        this.columns.push({ name: name, expression: expression, createCell: createCell });
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
                var cell = column.createCell ? column.createCell(value) : null;
                worksheet.setCell(rowIdx + 1, colIdx, value, cell);
            }
        });
        return worksheet;
    };
    return WorkSheetBuilder;
}());
var ExcelConverter = (function () {
    function ExcelConverter(_saveAs, xlsx) {
        this._saveAs = _saveAs;
        this.xlsx = xlsx;
    }
    ExcelConverter.prototype.create = function () {
        var wb = new WorkBook(this.xlsx);
        return wb;
    };
    ExcelConverter.prototype.createBuilder = function (values) {
        var builder = new WorkSheetBuilder(this.xlsx, values);
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
    ExcelConverter.$inject = ['saveAs', 'XLSX'];
    return ExcelConverter;
}());
Angular.module("angular-excel").service('excelConverter', ExcelConverter);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ndWxhci1leGNlbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9hcHAudHMiLCIuLi9zcmMvY2VsbEFkZHJlc3MudHMiLCIuLi9zcmMvY2VsbFJhbmdlLnRzIiwiLi4vc3JjL2NlbGwudHMiLCIuLi9zcmMvd29ya3NoZWV0LnRzIiwiLi4vc3JjL3dvcmtib29rLnRzIiwiLi4vc3JjL3dvcmtzaGVldEJ1aWxkZXIudHMiLCIuLi9zcmMvZXhjZWxDb252ZXJ0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBVSxLQUFLLENBT2Q7QUFQRCxXQUFVLEtBQUs7SUFJWCxPQUFPLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUM7U0FDOUIsUUFBUSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUM7U0FDMUIsUUFBUSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNoQyxDQUFDLEVBUFMsS0FBSyxLQUFMLEtBQUssUUFPZDtBQ0ZEO0lBQ0kscUJBQVksR0FBVyxFQUFFLEdBQVc7UUFDaEMsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDYixJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUNqQixDQUFDO0lBTUwsa0JBQUM7QUFBRCxDQUFDLEFBVkQsSUFVQztBQ1hEO0lBQ0k7UUFDSSxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksV0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMvQixJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksV0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBT0QsOEJBQVUsR0FBVixVQUFXLE9BQXFCO1FBQzVCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckIsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFD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QUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLDBCQUEwQixFQUFFLENBQUMsRUFBSyxJQUFJLFVBQU8sQ0FBQyxDQUFDO0lBQzNGLENBQUM7SUFFTyx3Q0FBZSxHQUF2QixVQUF3QixRQUFRO1FBQzVCLElBQUksTUFBTSxHQUFHLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM5QyxJQUFJLElBQUksR0FBRyxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLFFBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO1lBQ3RDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztRQUM1QyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUE1Qk0sc0JBQU8sR0FBRyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztJQTZCeEMscUJBQUM7Q0FBQSxBQS9CRCxJQStCQztBQUVELE9BQU8sQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLGNBQWMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsibmFtZXNwYWNlIGV4Y2VsIHtcclxuICAgIGRlY2xhcmUgdmFyIFhMU1g6IGFueTtcclxuICAgIGRlY2xhcmUgdmFyIHNhdmVBczogYW55O1xyXG5cclxuICAgIEFuZ3VsYXIubW9kdWxlKFwiYW5ndWxhci1leGNlbFwiLCBbXSlcclxuICAgICAgICAuY29uc3RhbnQoXCJzYXZlQXNcIiwgc2F2ZUFzKVxyXG4gICAgICAgIC5jb25zdGFudChcIlhMU1hcIiwgWExTWCk7XHJcbn0iLCJpbnRlcmZhY2UgSUNlbGxBZGRyZXNzIHtcclxuICAgIGM6IG51bWJlcjtcclxuICAgIHI6IG51bWJlcjtcclxufVxyXG5cclxuY2xhc3MgQ2VsbEFkZHJlc3MgaW1wbGVtZW50cyBJQ2VsbEFkZHJlc3Mge1xyXG4gICAgY29uc3RydWN0b3Iocm93OiBudW1iZXIsIGNvbDogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5yID0gcm93O1xyXG4gICAgICAgIHRoaXMuYyA9IGNvbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyAwLWluZGV4ZWQgY29sdW1uXHJcbiAgICBjOiBudW1iZXI7XHJcbiAgICAvLyAwLWluZGV4ZWQgcm93XHJcbiAgICByOiBudW1iZXI7XHJcbn0iLCJpbnRlcmZhY2UgSUNlbGxSYW5nZSB7XHJcbiAgICBhZGRBZGRyZXNzKGFkZHJlc3M6IElDZWxsQWRkcmVzcyk7XHJcbn1cclxuXHJcbmNsYXNzIENlbGxSYW5nZSBpbXBsZW1lbnRzIElDZWxsUmFuZ2Uge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5zID0gbmV3IENlbGxBZGRyZXNzKDAsIDApO1xyXG4gICAgICAgIHRoaXMuZSA9IG5ldyBDZWxsQWRkcmVzcygwLCAwKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBzdGFydFxyXG4gICAgczogQ2VsbEFkZHJlc3M7XHJcbiAgICAvLyBlbmRcclxuICAgIGU6IENlbGxBZGRyZXNzO1xyXG5cclxuICAgIGFkZEFkZHJlc3MoYWRkcmVzczogSUNlbGxBZGRyZXNzKSB7XHJcbiAgICAgICAgaWYgKGFkZHJlc3MuciA8IHRoaXMucy5yKVxyXG4gICAgICAgICAgICB0aGlzLnMuciA9IGFkZHJlc3MucjtcclxuICAgICAgICBpZiAoYWRkcmVzcy5jIDwgdGhpcy5zLmMpXHJcbiAgICAgICAgICAgIHRoaXMucy5jID0gYWRkcmVzcy5jO1xyXG5cclxuICAgICAgICBpZiAoYWRkcmVzcy5yID4gdGhpcy5lLnIpXHJcbiAgICAgICAgICAgIHRoaXMuZS5yID0gYWRkcmVzcy5yO1xyXG4gICAgICAgIGlmIChhZGRyZXNzLmMgPiB0aGlzLmUuYylcclxuICAgICAgICAgICAgdGhpcy5lLmMgPSBhZGRyZXNzLmM7XHJcbiAgICB9XHJcbn0iLCIvLyBzZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9TaGVldEpTL2pzLXhsc3gjY2VsbC1vYmplY3RcclxuXHJcbmludGVyZmFjZSBJQ2VsbCB7XHJcbiAgICB2OiBhbnk7XHJcbiAgICB3OiBzdHJpbmc7XHJcbiAgICB0OiBzdHJpbmc7XHJcbiAgICBmOiBzdHJpbmc7XHJcbiAgICBGOiBzdHJpbmc7XHJcbiAgICByOiBzdHJpbmc7XHJcbiAgICBoOiBzdHJpbmc7XHJcbiAgICBjOiBzdHJpbmc7XHJcbiAgICB6OiBzdHJpbmc7XHJcbiAgICBsOiBzdHJpbmc7XHJcbiAgICBzOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNsYXNzIENlbGwgaW1wbGVtZW50cyBJQ2VsbCB7XHJcbiAgICB2OiBhbnk7XHJcbiAgICB3OiBzdHJpbmc7XHJcbiAgICB0OiBzdHJpbmc7XHJcbiAgICBmOiBzdHJpbmc7XHJcbiAgICBGOiBzdHJpbmc7XHJcbiAgICByOiBzdHJpbmc7XHJcbiAgICBoOiBzdHJpbmc7XHJcbiAgICBjOiBzdHJpbmc7XHJcbiAgICB6OiBzdHJpbmc7XHJcbiAgICBsOiBzdHJpbmc7XHJcbiAgICBzOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNsYXNzIERhdGVDZWxsIGltcGxlbWVudHMgSUNlbGwge1xyXG4gICAgY29uc3RydWN0b3IodmFsdWU/OiBhbnksIGZvcm1hdHRlZFRleHQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLnYgPSB2YWx1ZTtcclxuICAgICAgICB0aGlzLnQgPSAnZCc7XHJcbiAgICAgICAgdGhpcy53ID0gZm9ybWF0dGVkVGV4dDtcclxuICAgIH1cclxuXHJcbiAgICB2OiBhbnk7XHJcbiAgICB3OiBzdHJpbmc7XHJcbiAgICB0OiBzdHJpbmc7XHJcbiAgICBmOiBzdHJpbmc7XHJcbiAgICBGOiBzdHJpbmc7XHJcbiAgICByOiBzdHJpbmc7XHJcbiAgICBoOiBzdHJpbmc7XHJcbiAgICBjOiBzdHJpbmc7XHJcbiAgICB6OiBzdHJpbmc7XHJcbiAgICBsOiBzdHJpbmc7XHJcbiAgICBzOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNsYXNzIFN0cmluZ0NlbGwgaW1wbGVtZW50cyBJQ2VsbCB7XHJcbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZT86IGFueSwgZm9ybWF0dGVkVGV4dD86IHN0cmluZykge1xyXG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHRoaXMudiA9IHZhbHVlO1xyXG4gICAgICAgIHRoaXMudCA9ICdzJztcclxuICAgICAgICB0aGlzLncgPSBmb3JtYXR0ZWRUZXh0O1xyXG4gICAgfVxyXG5cclxuICAgIHY6IGFueTtcclxuICAgIHc6IHN0cmluZztcclxuICAgIHQ6IHN0cmluZztcclxuICAgIGY6IHN0cmluZztcclxuICAgIEY6IHN0cmluZztcclxuICAgIHI6IHN0cmluZztcclxuICAgIGg6IHN0cmluZztcclxuICAgIGM6IHN0cmluZztcclxuICAgIHo6IHN0cmluZztcclxuICAgIGw6IHN0cmluZztcclxuICAgIHM6IHN0cmluZztcclxufSIsImludGVyZmFjZSBJV29ya1NoZWV0IHtcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIHNldENlbGwocm93OiBudW1iZXIsIGNvbDogbnVtYmVyLCB2YWx1ZTogYW55LCBjZWxsPzogSUNlbGwpO1xyXG4gICAgZ2V0Q2VsbChyb3c6IG51bWJlciwgY29sOiBudW1iZXIpOiBJQ2VsbDtcclxufVxyXG5cclxuY2xhc3MgV29ya1NoZWV0IGltcGxlbWVudHMgSVdvcmtTaGVldCB7XHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZSwgcHJpdmF0ZSB4bHN4OiBhbnkpIHtcclxuICAgICAgICB0aGlzLl9yYW5nZSA9IG5ldyBDZWxsUmFuZ2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9yYW5nZTogSUNlbGxSYW5nZTtcclxuXHJcbiAgICBzZXRDZWxsKHJvdzogbnVtYmVyLCBjb2w6IG51bWJlciwgdmFsdWU6IGFueSwgY2VsbD86IElDZWxsKSB7XHJcbiAgICAgICAgdmFyIGFkZHJlc3MgPSBuZXcgQ2VsbEFkZHJlc3Mocm93LCBjb2wpO1xyXG4gICAgICAgIGlmICghY2VsbClcclxuICAgICAgICAgICAgY2VsbCA9IG5ldyBTdHJpbmdDZWxsKHZhbHVlKTtcclxuXHJcbiAgICAgICAgdmFyIGNlbGxSZWZlcmVuY2UgPSB0aGlzLnhsc3gudXRpbHMuZW5jb2RlX2NlbGwoYWRkcmVzcyk7XHJcbiAgICAgICAgdGhpc1tjZWxsUmVmZXJlbmNlXSA9IGNlbGw7XHJcblxyXG4gICAgICAgIHRoaXMuX3JhbmdlLmFkZEFkZHJlc3MoYWRkcmVzcyk7XHJcbiAgICAgICAgdGhpc1tcIiFyZWZcIl0gPSB0aGlzLnhsc3gudXRpbHMuZW5jb2RlX3JhbmdlKHRoaXMuX3JhbmdlKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRDZWxsKHJvdzogbnVtYmVyLCBjb2w6IG51bWJlcik6IElDZWxsIHtcclxuICAgICAgICB2YXIgYWRkcmVzcyA9IG5ldyBDZWxsQWRkcmVzcyhyb3csIGNvbCk7XHJcbiAgICAgICAgdmFyIGNlbGxSZWZlcmVuY2UgPSB0aGlzLnhsc3gudXRpbHMuZW5jb2RlX2NlbGwoYWRkcmVzcyk7XHJcbiAgICAgICAgdmFyIGNlbGwgPSB0aGlzW2NlbGxSZWZlcmVuY2VdO1xyXG4gICAgICAgIHJldHVybiBjZWxsO1xyXG4gICAgfVxyXG59IiwiaW50ZXJmYWNlIElXb3JrQm9vayB7XHJcbiAgICBhZGRXb3JrU2hlZXQod3M6IHN0cmluZyB8IElXb3JrU2hlZXQpOiBJV29ya1NoZWV0O1xyXG5cclxufVxyXG5cclxuY2xhc3MgV29ya0Jvb2sgaW1wbGVtZW50cyBJV29ya0Jvb2sge1xyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSB4bHN4OiBhbnkpIHtcclxuICAgICAgICB0aGlzWydTaGVldE5hbWVzJ10gPSBbXTtcclxuICAgICAgICB0aGlzWydTaGVldHMnXSA9IHt9O1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFdvcmtTaGVldCh3b3Jrc2hlZXQ6IHN0cmluZyB8IElXb3JrU2hlZXQpOiBJV29ya1NoZWV0IHtcclxuICAgICAgICBpZiAodHlwZW9mIHdvcmtzaGVldCA9PSBcInN0cmluZ1wiKVxyXG4gICAgICAgICAgICB3b3Jrc2hlZXQgPSBuZXcgV29ya1NoZWV0KHdvcmtzaGVldCwgdGhpcy54bHN4KTtcclxuXHJcbiAgICAgICAgY29uc3QgbmFtZSA9IHdvcmtzaGVldC5uYW1lO1xyXG4gICAgICAgIGxldCBzaGVldE5hbWVzOiBzdHJpbmdbXSA9IHRoaXNbJ1NoZWV0TmFtZXMnXTtcclxuICAgICAgICBzaGVldE5hbWVzLnB1c2gobmFtZSk7XHJcbiAgICAgICAgdGhpc1snU2hlZXRzJ11bbmFtZV0gPSB3b3Jrc2hlZXQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHdvcmtzaGVldDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9zaGVldE5hbWVzOiBzdHJpbmdbXTtcclxuICAgIHByaXZhdGUgX3NoZWV0czogc3RyaW5nW11bXTtcclxufSIsImludGVyZmFjZSBJV29ya1NoZWV0QnVpbGRlcjxUPiB7XHJcbiAgICBhZGREYXRlQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+O1xyXG4gICAgYWRkQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSwgY3JlYXRlQ2VsbD86ICh4OiBhbnkpID0+IElDZWxsKTogSVdvcmtTaGVldEJ1aWxkZXI8VD47XHJcbiAgICBzZXROYW1lKG5hbWU6IHN0cmluZyk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+O1xyXG4gICAgYnVpbGQoKTogSVdvcmtTaGVldDtcclxufVxyXG5cclxuY2xhc3MgV29ya1NoZWV0QnVpbGRlcjxUPiBpbXBsZW1lbnRzIElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIHByaXZhdGUgeGxzeDogYW55LFxyXG4gICAgICAgIHByaXZhdGUgdmFsdWVzOiBUW11cclxuICAgICkge1xyXG4gICAgICAgIHRoaXMuY29sdW1ucyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZERhdGVDb2x1bW4obmFtZTogc3RyaW5nLCBleHByZXNzaW9uOiAoeDogVCkgPT4gYW55KTogSVdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgICAgIHRoaXMuY29sdW1ucy5wdXNoKHsgbmFtZTogbmFtZSwgZXhwcmVzc2lvbjogZXhwcmVzc2lvbiwgY3JlYXRlQ2VsbDogeCA9PiBuZXcgRGF0ZUNlbGwoeCkgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkQ29sdW1uKG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSwgY3JlYXRlQ2VsbD86ICh4OiBhbnkpID0+IElDZWxsKTogSVdvcmtTaGVldEJ1aWxkZXI8VD4ge1xyXG4gICAgICAgIHRoaXMuY29sdW1ucy5wdXNoKHsgbmFtZTogbmFtZSwgZXhwcmVzc2lvbjogZXhwcmVzc2lvbiwgY3JlYXRlQ2VsbDogY3JlYXRlQ2VsbCB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBzZXROYW1lKG5hbWU6IHN0cmluZyk6IElXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGJ1aWxkKCk6IElXb3JrU2hlZXQge1xyXG4gICAgICAgIHZhciB3b3Jrc2hlZXQgPSBuZXcgV29ya1NoZWV0KHRoaXMubmFtZSwgdGhpcy54bHN4KTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgY29sSWR4ID0gMDsgY29sSWR4IDwgdGhpcy5jb2x1bW5zLmxlbmd0aDsgY29sSWR4KyspIHtcclxuICAgICAgICAgICAgbGV0IGNvbHVtbiA9IHRoaXMuY29sdW1uc1tjb2xJZHhdO1xyXG4gICAgICAgICAgICB3b3Jrc2hlZXQuc2V0Q2VsbCgwLCBjb2xJZHgsIGNvbHVtbi5uYW1lKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMudmFsdWVzLmZvckVhY2goKHgsIHJvd0lkeCkgPT4ge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBjb2xJZHggPSAwOyBjb2xJZHggPCB0aGlzLmNvbHVtbnMubGVuZ3RoOyBjb2xJZHgrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbHVtbiA9IHRoaXMuY29sdW1uc1tjb2xJZHhdO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBjb2x1bW4uZXhwcmVzc2lvbih4KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNlbGwgPSBjb2x1bW4uY3JlYXRlQ2VsbCA/IGNvbHVtbi5jcmVhdGVDZWxsKHZhbHVlKSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICB3b3Jrc2hlZXQuc2V0Q2VsbChyb3dJZHggKyAxLCBjb2xJZHgsIHZhbHVlLCBjZWxsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gd29ya3NoZWV0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgbmFtZTogc3RyaW5nO1xyXG4gICAgcHJpdmF0ZSBjb2x1bW5zOiB7IG5hbWU6IHN0cmluZywgZXhwcmVzc2lvbjogKHg6IFQpID0+IGFueSwgY3JlYXRlQ2VsbD86ICh4OiBhbnkpID0+IElDZWxsIH1bXTtcclxufSIsImludGVyZmFjZSBJRXhjZWxDb252ZXJ0ZXIge1xyXG4gICAgY3JlYXRlKCk6IElXb3JrQm9vaztcclxuICAgIGNyZWF0ZUJ1aWxkZXI8VD4odmFsdWVzOiBUW10pOiBXb3JrU2hlZXRCdWlsZGVyPFQ+O1xyXG4gICAgc2F2ZUFzKG5hbWU6IHN0cmluZywgd29ya2Jvb2s6IElXb3JrQm9vayk7XHJcbn1cclxuXHJcbmNsYXNzIEV4Y2VsQ29udmVydGVyIGltcGxlbWVudHMgSUV4Y2VsQ29udmVydGVyIHtcclxuXHJcbiAgICBzdGF0aWMgJGluamVjdCA9IFsnc2F2ZUFzJywgJ1hMU1gnXTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9zYXZlQXM6IGFueSwgcHJpdmF0ZSB4bHN4OiBhbnkpIHtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlKCk6IElXb3JrQm9vayB7XHJcbiAgICAgICAgdmFyIHdiID0gbmV3IFdvcmtCb29rKHRoaXMueGxzeCk7XHJcbiAgICAgICAgcmV0dXJuIHdiO1xyXG4gICAgfVxyXG5cclxuICAgIGNyZWF0ZUJ1aWxkZXI8VD4odmFsdWVzOiBUW10pOiBXb3JrU2hlZXRCdWlsZGVyPFQ+IHtcclxuICAgICAgICBjb25zdCBidWlsZGVyID0gbmV3IFdvcmtTaGVldEJ1aWxkZXIodGhpcy54bHN4LCB2YWx1ZXMpO1xyXG4gICAgICAgIHJldHVybiBidWlsZGVyO1xyXG4gICAgfVxyXG5cclxuICAgIHNhdmVBcyhuYW1lOiBzdHJpbmcsIHdvcmtib29rOiBJV29ya0Jvb2spIHtcclxuICAgICAgICB2YXIgd2JvdXQgPSB0aGlzLnhsc3gud3JpdGUod29ya2Jvb2ssIHsgYm9va1R5cGU6ICd4bHN4JywgYm9va1NTVDogZmFsc2UsIHR5cGU6ICdiaW5hcnknIH0pO1xyXG4gICAgICAgIHZhciBidWZmZXIgPSB0aGlzLmNvbnZlcnRUb0JpbmFyeSh3Ym91dCk7XHJcbiAgICAgICAgdGhpcy5fc2F2ZUFzKG5ldyBCbG9iKFtidWZmZXJdLCB7IHR5cGU6IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCIgfSksIGAke25hbWV9Lnhsc3hgKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNvbnZlcnRUb0JpbmFyeSh3b3JrYm9vaykge1xyXG4gICAgICAgIHZhciBidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIod29ya2Jvb2subGVuZ3RoKTtcclxuICAgICAgICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgIT09IHdvcmtib29rLmxlbmd0aDsgKytpKVxyXG4gICAgICAgICAgICB2aWV3W2ldID0gd29ya2Jvb2suY2hhckNvZGVBdChpKSAmIDB4RkY7XHJcbiAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcclxuICAgIH1cclxufVxyXG5cclxuQW5ndWxhci5tb2R1bGUoXCJhbmd1bGFyLWV4Y2VsXCIpLnNlcnZpY2UoJ2V4Y2VsQ29udmVydGVyJywgRXhjZWxDb252ZXJ0ZXIpOyJdfQ==