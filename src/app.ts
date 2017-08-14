namespace excel {
    declare var XLSX: any;
    declare var saveAs: any;
    declare var moment: any;

    Angular.module("angular-excel", [])
        .constant("saveAs", saveAs)
        .constant("XLSX", XLSX)
        .constant("moment", moment);
}