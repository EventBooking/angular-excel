/* global angular */

function Config() {
	console.log("configed");
}

Run.$inject = ['$rootScope', 'excelConverter'];

function Run($rootScope, excelConverter) {
    $rootScope.vm = new TestController(excelConverter);
    console.log("running");
}

function TestController(excelConverter) {
    this.date = '2017-02-10';

	this.show = function(date) {
        var worksheet = excelConverter.createBuilder([date])
            .setName('test')
            .addDateColumn("Date", x => x)
            .build();

        var workbook = excelConverter.create();
        workbook.addWorkSheet(worksheet);

        this.workbook = workbook;
    }

    this.check = function(text) {
        this.workbook = JSON.parse(text);
        console.log(text);
    }

    this.download = function() {
        excelConverter.saveAs('test', this.workbook);
    }
}

angular.module("demo", ["angular-excel", "ngPrettyJson"])
    .config(Config)
	.run(Run);