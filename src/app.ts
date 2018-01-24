namespace excel {
    declare var XLSX: any;
    declare var saveAs: any;
    declare var moment: any;
    declare var currency: any;
    declare var accounting: any;

    class ExcelRun {
        static $inject = ["saveAs", "XLSX", "currency", "accounting"];

        constructor(saveAs: any, xlsx: any, currency: any, accounting: any) {
            ExcelUtils.bootstrap(saveAs, xlsx, currency, accounting);
        }
    }

    Angular.module("angular-excel", [])
        .constant("saveAs", saveAs)
        .constant("XLSX", XLSX)
        .constant("currency", currency)
        .constant("accounting", accounting)
        .run(ExcelRun);
}