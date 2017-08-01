namespace excel {
    declare var XLSX: any;
    declare var saveAs: any;

    Angular.module("angular-excel", [])
        .constant("saveAs", saveAs)
        .constant("XLSX", XLSX);
}