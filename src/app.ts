namespace excel {
    declare var XLSX: any;
    declare var saveAs: any;
    declare var moment: any;
    declare var currency: any;
    declare var accounting: any;

    Angular.module("angular-excel", [])
        .constant("saveAs", saveAs)
        .constant("XLSX", XLSX)
        .constant("moment", moment)
        .constant("currency", currency)
        .constant("accounting", accounting);
}