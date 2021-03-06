import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {FlowRouter} from 'meteor/kadira:flow-router';
import {FlowRouterTitle} from 'meteor/ostrio:flow-router-title';
import 'meteor/arillo:flow-router-helpers';
import 'meteor/zimme:active-route';
import 'meteor/theara:flow-router-breadcrumb';

// Lib
import {__} from '../../core/common/libs/tapi18n-callback-helper.js';

// Layout
import {Layout} from '../../core/client/libs/render-layout.js';
import '../../core/imports/ui/layouts/report/index.html';
// import './subscription/subscriptionGlobal.js'

// Group
let AccRoutes = FlowRouter.group({
    prefix: '/acc',
    title: "Accounting",
    titlePrefix: 'Accounting > ',
    subscriptions: function (params, queryParams) {
//     this.register('files', Meteor.subscribe('files'));
    }
});


import '../imports/ui/pages/fixAssetDep/fixAssetDep';
AccRoutes.route('/fixAssetDepSummaryList', {
    name: 'acc.fixAssetDepSummaryList',
    title: __('acc.fixAssetDepSummaryList.title'),
    action: function (params, queryParams) {
        Layout.report('acc_fixAssetDepSummaryList');
    }
});

AccRoutes.route('/fixAssetDepList', {
    name: 'acc.fixAssetDepList',
    title: __('acc.fixAssetDepList.title'),
    action: function (params, queryParams) {
        Layout.report('acc_fixAssetDepList');
    }
});


// Balance Sheet
import '../imports/ui/reports/balanceSheet/balanceSheet.js';
AccRoutes.route('/balanceSheet-report', {
    name: 'acc.balanceSheetReport',
    title: __('acc.balanceSheetReport.title'),
    action: function (params, queryParams) {
        Layout.main('acc_balanceSheetReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: __('acc.balanceSheetReport.title'),
        icon: 'users',
        parent: 'acc.home'
    }
});

AccRoutes.route('/balanceSheet-report-gen', {
    name: 'acc.balanceSheetReportGen',
    title: __('acc.balanceSheetReport.title'),
    action: function (params, queryParams) {
        if (queryParams.currencyId == "All") {
            Layout.report('acc_balanceSheetForAllReportGen');
        } else {
            Layout.report('acc_balanceSheetReportGen');
        }
    }
});

//BalanceSheetNBC
import '../imports/ui/reports/balanceSheetNBC/balanceSheetNBC';
AccRoutes.route('/BalanceSheetNBCReport', {
    name: 'acc.BalanceSheetNBCReport',
    title: __('acc.balanceSheetNBCReport.title'),
    subscriptions: function (params, queryParams) {
        this.register(
            'acc_exchangeNBC',
            Meteor.subscribe('acc_exchangeNBC')
        );
    },
    action: function (params, queryParams) {
        Layout.main('acc_BalanceSheetNBCReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'BalanceSheet NBC Report',
        parent: 'acc.home'
    }
});

AccRoutes.route('/BalanceSheetNBCReportGen', {
    name: 'acc.BalanceSheetNBCReportGen',
    action: function (params, queryParams) {
        Layout.report('acc_BalanceSheetNBCReportGen');
    }
});

//BalanceSheetNBCKH
import '../imports/ui/reports/balanceSheetNBCKH/balanceSheetNBCKH';
AccRoutes.route('/BalanceSheetNbcKhReport', {
    name: 'acc.BalanceSheetNbcKhReport',
    title: __('acc.balanceSheetReport.title'),
    subscriptions: function (params, queryParams) {
        this.register(
            'acc_exchangeNBC',
            Meteor.subscribe('acc_exchangeNBC')
        );
    },
    action: function (params, queryParams) {
        Layout.main('acc_BalanceSheetNbcKhReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'BalanceSheet NBC Report',
        parent: 'acc.home'
    }
});

AccRoutes.route('/BalanceSheetNbcKhReportGen', {
    name: 'acc.BalanceSheetNbcKhReportGen',
    action: function (params, queryParams) {
        Layout.report('acc_BalanceSheetNbcKhReportGen');
    }
});
//CurrencyClosing
import '../imports/ui/reports/currencyClosing/currencyClosing';
AccRoutes.route('/currencyClosingReport', {
    name: 'acc.currencyClosingReport',
    title: __('acc.currencyClosingReport.title'),
    subscriptions: function (params, queryParams) {
        this.register(
            'accCloseChartAccount',
            Meteor.subscribe('acc.closeChartAccount')
        ), this.register(
            'accCloseChartAccount',
            Meteor.subscribe('acc.closing')
        ),
            this.register(
                'cpanel_exchange',
                Meteor.subscribe('core.exchange')
            );
    },
    action: function (params, queryParams) {
        Layout.main('acc_currencyClosingReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Currency Closing Report',
        parent: 'acc.home'
    }
});

AccRoutes.route('/currencyClosingReportGen', {
    name: 'acc.currencyClosingReportGen',
    action: function (params, queryParams) {
        Layout.report('acc_currencyClosingReportGen');
    }
});

//DateEndOfProcess
AccRoutes.route('/dateEndOfProcess', {
    name: 'acc.dateEndOfProcess',
    title: __('acc.dateEndOfProcess.title'),
    subscriptions: function (params, queryParams) {
        this.register(
            'accDateEndOfProcess',
            Meteor.subscribe('accDateEndOfProcess')
        ), this.register(
            'accCloseChartAccount',
            Meteor.subscribe('accCloseChartAccount')
        );
    },
    action: function (params, queryParams) {
        Layout.main('acc_dateEndOfProcess');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'End Of Process',
        parent: 'acc.home'
    }
});

//Income and Expenditure
import '../imports/ui/reports/incomeAndExpenditure/incomeAndExpenditure';
AccRoutes.route('/IncomeAndExpenditureReport', {
    name: 'acc.IncomeAndExpenditureReport',
    title: __('acc.incomeAndExpenditureReport.title'),
    subscriptions: function (params, queryParams) {
        this.register(
            'acc_exchangeNBC',
            Meteor.subscribe('acc_exchangeNBC')
        );
    },
    action: function (params, queryParams) {
        Layout.main('acc_IncomeAndExpenditure');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Income And Expenditure Report',
        parent: 'acc.home'
    }
});

AccRoutes.route('/IncomeAndExpenditureReportGen', {
    name: 'acc.IncomeAndExpenditureReportGen',
    action: function (params, queryParams) {
        Layout.report('acc_IncomeAndExpenditureReportGen');
    }
});

//Income and Expenditure KH
import '../imports/ui/reports/incomeAndExpenditureKH/incomeAndExpenditureKH';
AccRoutes.route('/IncomeAndExpenditureKhReport', {
    name: 'acc.IncomeAndExpenditureKhReport',
    title: __('acc.incomeAndExpenditureReport.title'),
    subscriptions: function (params, queryParams) {
        this.register(
            'acc_exchangeNBC',
            Meteor.subscribe('acc_exchangeNBC')
        );
    },
    action: function (params, queryParams) {
        Layout.main('acc_IncomeAndExpenditureKh');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Income And Expenditure Report',
        parent: 'acc.home'
    }
});

AccRoutes.route('/IncomeAndExpenditureKhReportGen', {
    name: 'acc.IncomeAndExpenditureKhReportGen',
    action: function (params, queryParams) {
        Layout.report('acc_IncomeAndExpenditureKhReportGen');
    }
});

//Journal
import '../imports/ui/reports/journal/journal';
AccRoutes.route('/journalReport', {
    name: 'acc.journalReport',
    title: __('acc.journalReport.title'),
    action: function (params, queryParams) {
        Layout.main('acc_journalReport');
    },

    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Journal Report',
        parent: 'acc.home'
    }
});

AccRoutes.route('/journalReportGen', {
    name: 'acc.journalReportGen',
    action: function (params, queryParams) {
        Layout.report('acc_journalReportGen');
    }
});


//Ledger
import '../imports/ui/reports/ledger/ledger';
AccRoutes.route('/ledgerReport', {
    name: 'acc.ledgerReport',
    title: __('acc.ledgerReport.title'),
    subscriptions: function (params, queryParams) {
        this.register('cpanel_exchange', Meteor.subscribe('cpanel_exchange'));
        this.register('acc.mapUserAndAccount', Meteor.subscribe('acc.mapUserAndAccount'));
    },
    action: function (params, queryParams) {
        Layout.main('acc_ledgerReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Ledger Report',
        parent: 'acc.home'
    }
});

AccRoutes.route('/ledgerReportGen', {
    name: 'acc.ledgerReportGen',
    subscriptions: function (params, queryParams) {
        this.register(
            'acc_Journal',
            Meteor.subscribe('acc_Journal')
        );
    },
    action: function (params, queryParams) {
        Layout.report('acc_ledgerReportGen');
    }
})
;

//cash
import '../imports/ui/reports/cash/cash.js';
AccRoutes.route('/cashReport', {
    name: 'acc.cashReport',
    title: __('acc.cashReport.title'),
    subscriptions: function (params, queryParams) {
        this.register('cpanel_exchange', Meteor.subscribe('cpanel_exchange'));
        this.register('acc.mapUserAndAccount', Meteor.subscribe('acc.mapUserAndAccount'));
    },
    action: function (params, queryParams) {
        Layout.main('acc_cashReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Cash Report',
        parent: 'acc.home'
    }
});

AccRoutes.route('/cashReportGen', {
    name: 'acc.cashReportGen',
    subscriptions: function (params, queryParams) {
        this.register(
            'acc_Journal',
            Meteor.subscribe('acc_Journal')
        );
    },
    action: function (params, queryParams) {
        Layout.report('acc_cashReportGen');
    }
})
;

//Profit Lost
import '../imports/ui/reports/profitLost/profitLost';
AccRoutes.route('/ProfitLostReport', {
    name: 'acc.ProfitLostReport',
    title: __('acc.profitLostReport.title'),
    subscriptions: function (params, queryParams) {
        this.register(
            'cpanel_exchange',
            Meteor.subscribe('cpanel_exchange')
        );
    },
    action: function (params, queryParams) {
        Layout.main('acc_ProfitLostReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Profit & Lost Report',
        parent: 'acc.home'
    }
});

AccRoutes.route('/ProfitLostReportGen', {
    name: 'acc.ProfitLostReportGen',
    action: function (params, queryParams) {
        if (queryParams.currencyId == "All") {
            Layout.report('acc_ProfitLostForAllReportGen');
        } else {
            Layout.report('acc_ProfitLostReportGen');
        }
    }
});

//Trial Balance
import '../imports/ui/reports/trialBalance/trialBalance';
AccRoutes.route('/trialBalanceReport', {
    name: 'acc.trialBalanceReport',
    title: __('acc.trialBalanceReport.title'),
    subscriptions: function (params, queryParams) {
        this.register(
            'cpanel_exchange',
            Meteor.subscribe('cpanel_exchange')
        );
        this.register(
            'acc.mapUserAndAccount',
            Meteor.subscribe('acc.mapUserAndAccount')
        );
    },
    action: function (params, queryParams) {
        Layout.main('acc_trialBalanceReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Trial Balance Report',
        parent: 'acc.home'
    }
});

AccRoutes.route('/trialBalanceReportGen', {
    name: 'acc.trialBalanceReportGen',
    action: function (params, queryParams) {
        Layout.report('acc_trialBalanceReportGen');
    }
});

//Cash Flow
import '../imports/ui/reports/cashFlow/cashFlow';
AccRoutes.route('/cashFlowReport', {
    name: 'acc.cashFlowReport',
    title: __('acc.cashFlowReport.title'),
    subscriptions: function (params, queryParams) {
        this.register(
            'cpanel_exchange',
            Meteor.subscribe('cpanel_exchange')
        );
    },
    action: function (params, queryParams) {
        Layout.main('acc_cashFlowReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Cash Flow Report',
        parent: 'acc.home'
    }
});

AccRoutes.route('/cashFlowReportGen', {
    name: 'acc.cashFlowReportGen',
    action: function (params, queryParams) {
        Layout.report('acc_cashFlowReportGen');
    }
});


//Profi Lost Comparation
import '../imports/ui/reports/profitLostComparation/profitLostComparation';
AccRoutes.route('/profitLostComparationReport', {
    name: 'acc.profitLostComparationReport',
    title: __('acc.profitLostComparationReport.title'),
    subscriptions: function (params, queryParams) {
        this.register(
            'cpanel_exchange',
            Meteor.subscribe('cpanel_exchange')
        );
    },
    action: function (params, queryParams) {
        Layout.main('acc_ProfitLostReportComparation');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Profit Lost Comparation Report',
        parent: 'acc.home'
    }
});

AccRoutes.route('/profitLostComparationReportGen', {
    name: 'acc.profitLostComparationReportGen',
    action: function (params, queryParams) {
        Layout.report('acc_ProfitLostComparationReportGen');
    }
});
