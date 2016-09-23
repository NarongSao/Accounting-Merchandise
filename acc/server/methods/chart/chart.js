import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {NetInCome} from '../../../imports/api/collections/netIncome';
import {CloseChartAccount} from '../../../imports/api/collections/closeChartAccount';
import {CloseChartAccountPerMonth} from '../../../imports/api/collections/closeChartAccountPerMonth';
import {ChartAccount} from '../../../imports/api/collections/chartAccount';

Meteor.methods({
    chart_netIncome(param){
        var currentDate = new Date();

        var dataMain = {};
        var data = [];
        var monthList = [];
        var valueList=[];

        var selector = {};
        selector.year = param.year;

        var arr = [];
        for (let i = 1; i < 13; i++) {
            let monthNumber = s.pad(i, 2, "0");
            selector.month = monthNumber;

            monthList.push(getMonthName(i));

            var netIncome = NetInCome.find(selector).fetch();
            if (netIncome.length >0) {
                netIncome.forEach((obj)=> {
                    if (param.currency == "usd") {
                        valueList.push(obj.dollar)
                    } else if (param.currency == "khr") {
                        valueList.push(obj.riel)
                    } else if (param.currency == "baht") {
                        valueList.push(obj.baht)
                    }
                })
            } else {
                valueList.push(0);
            }
        }

        data.push({
            type: 'column',
            data: valueList,
            name: "Net Income"
        })

        dataMain.data = data;
        dataMain.monthList = monthList;
        return dataMain;

    }
    , chart_accountEveryMonth: function (selector) {
        let dataMain = {};
        let data = [];
        let chartAccountList = [];
        var chartAccount = ChartAccount.find({accountTypeId: "40"}).fetch();
        for (let i = 1; i < 13; i++) {
            let monthNumber = s.pad(i, 2, "0");
            let valueAccountList = [];
            chartAccount.forEach(function (account) {
                if (i == 1) {
                    chartAccountList.push(account.code + " | " + account.name);
                }
                selector.closeChartAccountId = account._id;


                selector.month = monthNumber;
                var closeChartAccount = CloseChartAccountPerMonth.findOne(selector);
                if (closeChartAccount != undefined) {
                    if (["20", "21", "30", "40", "41"].indexOf(closeChartAccount.accountTypeId) > -1) {
                        valueAccountList.push(numeral().unformat(numeral(-1 * closeChartAccount.value).format('(0,0.00)')));
                    } else {
                        valueAccountList.push(numeral().unformat(numeral(closeChartAccount.value).format('(0,0.00)')));
                    }
                } else {
                    valueAccountList.push(0);
                }
            })
            let monthName = getMonthName(i);
            data.push({
                type: 'line',
                data: valueAccountList,
                name: monthName
            })
        }
        dataMain.chartAccountList = chartAccountList;
        dataMain.data = data;
        return dataMain;
    }
    , chart_accountEveryMonthCombination: function (selector, accountTypeId) {
        let dataMain = {};
        let data = [];
        let monthList = [];
        var chartAccount = ChartAccount.find({accountTypeId: accountTypeId}).fetch();
        let j = 1;
        chartAccount.forEach(function (account) {
            let valueAccountList = [];
            selector.closeChartAccountId = account._id;

            for (let i = 1; i < 13; i++) {
                if (j == 1) {
                    monthList.push(getMonthName(i));
                }


                let monthNumber = s.pad(i, 2, "0");
                selector.month = monthNumber;
                var closeChartAccount = CloseChartAccountPerMonth.findOne(selector);
                if (closeChartAccount != undefined) {
                    if (["20", "21", "30", "40", "41"].indexOf(closeChartAccount.accountTypeId) > -1) {
                        valueAccountList.push(numeral().unformat(numeral(-1 * closeChartAccount.value).format('(0,0.00)')));
                    } else {
                        valueAccountList.push(numeral().unformat(numeral(closeChartAccount.value).format('(0,0.00)')));
                    }
                } else {
                    valueAccountList.push(0);
                }

            }
            j++;
            data.push({
                type: 'line',
                data: valueAccountList,
                name: account.code + " | " + account.name
            })

        })
        dataMain.xData = monthList;
        dataMain.datasets = data;
        return dataMain;
    }
    , chart_companySnapshot: function (selector) {

        let thisSelector = {};
        let valueAccountListIncome = [];
        let accountListIncome = [];

        let valueAccountListExpense = [];
        let accountListExpense = [];

        let data = {};
        let dataIncome = [];
        let dataExpense = [];


        thisSelector.accountTypeId = {$in: ['40', '41', '50', '51']}
        thisSelector.year = '2016';
        thisSelector.month = '06';
        thisSelector.currencyId = 'USD';

        let amountList = CloseChartAccountPerMonth.find(thisSelector).fetch();


        amountList.forEach(function (obj) {
            if (['40', '41'].indexOf(obj.accountTypeId) != -1) {
                valueAccountListIncome.push({y: -1 * math.round(obj.value, 2), name: obj.code + " | " + obj.name});
                accountListIncome.push(obj.code + " | " + obj.name);
            } else if (['50', '51'].indexOf(obj.accountTypeId) != -1) {
                valueAccountListExpense.push({y: math.round(obj.value), name: obj.code + " | " + obj.name});
                accountListExpense.push(obj.code + " | " + obj.name);
            }
        });

        dataIncome.push({
            type: 'pie',
            data: valueAccountListIncome
        })

        dataExpense.push({
            type: 'pie',
            data: valueAccountListExpense
        })
        data.dataIncome = dataIncome;
        data.dataExpense = dataExpense;
        data.accountListIncome = accountListIncome;
        data.accountListExpense = accountListExpense;
        return data;

    }
});

let getMonthName = (number) => {
    let month = '';
    switch (number) {
        case 1:
            month = 'មករា'
            break;
        case 2:
            month = 'កុម្ភៈ​'
            break;
        case 3:
            month = 'មិនា'
            break;
        case 4:
            month = 'មេសា'
            break;
        case 5:
            month = 'ឧសភា'
            break;
        case 6:
            month = 'មិថុនា'
            break;
        case 7:
            month = 'កក្កដា'
            break;
        case 8:
            month = 'សីហា'
            break;
        case 9:
            month = 'កញ្ញា'
            break;
        case 10:
            month = 'តុលា'
            break;
        case 11:
            month = 'វិច្ឆិកា'
            break;
        case 12:
            month = 'ធ្នូ'
            break;

    }
    return month;
}