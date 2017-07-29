import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {Setting} from '../../../../core/imports/api/collections/setting';
import {CloseChartAccount} from '../../../imports/api/collections/closeChartAccount';
import {MapNBCBalanceKH} from '../../../imports/api/collections/mapNBCBalanceKH';
import {ExchangeNBC} from '../../../imports/api/collections/exchangeNBC';

Meteor.methods({
  acc_BalanceSheetNBCKH: function(params) {
    if (!this.isSimulation) {
      var data = {
        title: {},
        header: {},
        content: [{
          index: 'No Result'
        }],
        footer: {}
      };


      /****** Title *****/
      data.title = Company.findOne();

      /****** Header *****/
      let exchangeData=ExchangeNBC.findOne({_id: params.exchangeDate});
        params.exchangeData=moment(exchangeData.dateTime).format("DD/MM/YYYY") + ' | ' + JSON.stringify(exchangeData.rates)

        data.header = params;


      /****** Content *****/
      var self = params;
      var selector = {};
      var exchangeDate = self.exchangeDate;

      var selectorGetLastDate = {};
      var selectorGetLastBalance = {};

      var startYear = moment(self.date, "DD/MM/YYYY").format("YYYY");
      var startDate = moment('01-01-' + startYear, "DD/MM/YYYY").toDate();

      //Get Last Date Closing
      if (self.date != null) {
        selectorGetLastDate.closeDate = {
          $lt: moment(self.date, "DD/MM/YYYY").toDate()
        };
      }

      if (self.branchId != "All") {
        selectorGetLastDate.branchId = self.branchId;
      }
      var lastDate = CloseChartAccount.findOne(
          selectorGetLastDate, {
            sort: {
              closeDate: -1
            }
          });
      //Parameter for Balance Last End Of Process
      if (lastDate != null) {
        selectorGetLastBalance.closeDate = lastDate.closeDate;
      }
      if (self.branchId != "All") {
        selectorGetLastBalance.branchId = self.branchId;
      }

      //Parameter for balance sheet
      if (lastDate != null) {
        selector.journalDate = {
          $gte: moment(moment(lastDate.closeDate).format("DD/MM/YYYY"), "DD/MM/YYYY").add(1, "days").toDate(),
          $lt: moment(self.date, "DD/MM/YYYY").add(1, "days").toDate()
        };
      } else {
        selector.journalDate = {
          $lt: moment(self.date, "DD/MM/YYYY").add(1, "days").toDate(),
          $gte: startDate
        };
      }
      if (self.branchId != "All") {
        selector.branchId = self.branchId;
      }


      //Condition to get Net Income
      var selectorProfit = {};
      if (!_.isEmpty(self.date)) {
        selectorProfit.journalDate = {
          $lt: moment(self.date, "DD/MM/YYYY").add(1, 'days').toDate(),
          $gte: startDate
        };
      }
      if (self.branchId != "All") {
        selectorProfit.branchId = self.branchId;
      }

      selectorProfit['transaction.accountDoc.accountTypeId'] = {
        $gte: "40",
        $lte: "59"
      };

      var contentProfit = {};
      var resultIncome = [];
      var resultExpense = [];

      var grandTotalIncome = 0;
      var grandTotalIncomeUSD = 0;
      var grandTotalIncomeR = 0;
      var grandTotalIncomeB = 0;
      var grandTotalExpenseUSD = 0;
      var grandTotalExpenseR = 0;
      var grandTotalExpenseB = 0;
      var grandTotalExpense = 0;
      var baseCurrency = "KHR";

      var profitAndLost = Meteor.call("getProfitLostNBC", selectorProfit,
          baseCurrency, exchangeDate);

      profitAndLost.reduce(function (key, val) {
        if (!key[val.account]) {
          var amountUsd = 0,
              amountRiel = 0,
              amountThb = 0;
          if (val.currency == "USD") {
            amountUsd = val.result;
          } else if (val.currency == "KHR") {
            amountRiel = val.result;
          } else if (val.currency == "THB") {
            amountThb = val.result;
          }
          key[val.account] = {
            result: val.result,
            name: val.name,
            currency: baseCurrency,
            code: val.code,
            amountUsd: amountUsd,
            amountRiel: amountRiel,
            amountThb: amountThb
          };
          if (val.accountType >= 40 && val.accountType <= 49) {
            resultIncome.push(key[val.account]);
          } else if (val.accountType >= 50 && val.accountType <= 59) {
            resultExpense.push(key[val.account]);
          }

        } else {
          key[val.account].result += val.result;
          if (val.currency == "USD") {
            key[val.account].amountUsd += val.result;
          } else if (val.currency == "KHR") {
            key[val.account].amountRiel += val.result;
          } else if (val.currency == "THB") {
            key[val.account].amountThb += val.result;
          }
        }
        if (val.accountType >= 40 && val.accountType <= 49) {
          grandTotalIncome += val.result;
          if (val.currency == "USD") {
            grandTotalIncomeUSD += val.result;
          } else if (val.currency == "KHR") {
            grandTotalIncomeR += val.result;
          } else if (val.currency == "THB") {
            grandTotalIncomeB += val.result;
          }
        } else if (val.accountType >= 50 && val.accountType <= 59) {
          grandTotalExpense += val.result;
          if (val.currency == "USD") {
            grandTotalExpenseUSD += val.result;
          } else if (val.currency == "KHR") {
            grandTotalExpenseR += val.result;
          } else if (val.currency == "THB") {
            grandTotalExpenseB += val.result;
          }
        }

        return key;
      }, {});

      contentProfit.resultIncome = resultIncome;
      contentProfit.grandTotalIncome = grandTotalIncome;
      contentProfit.grandTotalIncomeUSD = grandTotalIncomeUSD;
      contentProfit.grandTotalIncomeR = grandTotalIncomeR;
      contentProfit.grandTotalIncomeB = grandTotalIncomeB;
      contentProfit.resultExpense = resultExpense;
      contentProfit.grandTotalExpenseUSD = grandTotalExpenseUSD;
      contentProfit.grandTotalExpenseR = grandTotalExpenseR;
      contentProfit.grandTotalExpenseB = grandTotalExpenseB;
      contentProfit.grandTotalExpense = grandTotalExpense;

      contentProfit.profit = grandTotalIncome - grandTotalExpense;
      contentProfit.profitUSD = grandTotalIncomeUSD - grandTotalExpenseUSD;
      contentProfit.profitR = grandTotalIncomeR - grandTotalExpenseR;
      contentProfit.profitB = grandTotalIncomeB - grandTotalExpenseB;
      contentProfit.currencySelect = baseCurrency;


      var result = [];
      //New Balance
      var balanceSheet = Meteor.call("getBalanceSheetNBC", selector,
          baseCurrency, exchangeDate, selectorGetLastBalance, lastDate);
      balanceSheet.reduce(function (key, val) {
        if (!key[val.account]) {
          var amountUsd = 0,
              amountRiel = 0,
              amountThb = 0;
          if (val.currency == "USD") {
            amountUsd = val.result;
          } else if (val.currency == "KHR") {
            amountRiel = val.result;
          } else if (val.currency == "THB") {
            amountThb = val.result;
          }
          key[val.account] = {
            result: val.result,
            name: val.name,
            account: val.account,
            currency: baseCurrency,
            code: val.code,
            accountTypeId: val.accountTypeId,
            level: val.level,
            parent: val.parent == null ? "" : val.parent,
            amountUsd: amountUsd,
            amountRiel: amountRiel,
            amountThb: amountThb


          };
          result.push(key[val.account]);
        } else {
          key[val.account].result += math.round(val.result, 3);
          if (val.currency == "USD") {
            key[val.account].amountUsd += math.round(val.result, 3);
          } else if (val.currency == "KHR") {
            key[val.account].amountRiel += math.round(val.result, 3);
          } else if (val.currency == "THB") {
            key[val.account].amountThb += math.round(val.result, 3);
          }
        }
        return key;
      }, {});

      /*
       * Assets
       * */
      data.cashAndBalanceWithNBC = 0;
      data.cashAndBalanceWithNBCOther = 0;
      data.cashAndBalanceWithNBCTotal = 0;

      data.cashOnHand = 0;
      data.cashOnHandOther = 0;
      data.cashOnHandTotal = 0;

      data.balanceNBC = 0;
      data.balanceNBCOther = 0;
      data.balanceNBCTotal = 0;

      data.accountBank = 0;
      data.accountBankOther = 0;
      data.accountBankTotal = 0;

      data.interestReceivable = 0;
      data.interestReceivableOther = 0;
      data.interestReceivableTotal = 0;

      data.loanAndAdvancedToCustomer = 0;
      data.loanAndAdvancedToCustomerOther = 0;
      data.loanAndAdvancedToCustomerTotal = 0;

      data.creditBalance = 0;
      data.creditBalanceOther = 0;
      data.creditBalanceTotal = 0;

      data.creditBalanceLessThanOneMonth = 0;
      data.creditBalanceLessThanOneMonthOther = 0;
      data.creditBalanceLessThanOneMonthTotal = 0;


      data.loanLossReverse = 0;
      data.loanLossReverseOther = 0;
      data.loanLossReverseTotal = 0;

      data.netCreditBalance = 0;
      data.netCreditBalanceOther = 0;
      data.netCreditBalanceTotal = 0;

      data.interestReceivableCredit = 0;
      data.interestReceivableCreditOther = 0;
      data.interestReceivableCreditTotal = 0;

      data.propertyAndEquipment = 0;
      data.propertyAndEquipmentOther = 0;
      data.propertyAndEquipmentTotal = 0;


      data.landNet = 0;
      data.landNetOther = 0;
      data.landNetTotal = 0;

      data.land = 0;
      data.landOther = 0;
      data.landTotal = 0;

      data.landAccumulatedDep = 0;
      data.landAccumulatedDepOther = 0;
      data.landAccumulatedDepTotal = 0;

      data.buildingNet = 0;
      data.buildingNetOther = 0;
      data.buildingNetTotal = 0;

      data.buildingAtCost = 0;
      data.buildingAtCostOther = 0;
      data.buildingAtCostTotal = 0;


      data.buildingAccumulatedDep = 0;
      data.buildingAccumulatedDepOther = 0;
      data.buildingAccumulatedDepTotal = 0;

      data.OtherFixAssetNet = 0;
      data.OtherFixAssetNetOther = 0;
      data.OtherFixAssetNetTotal = 0;


      data.otherFixAssetsAtCost = 0;
      data.otherFixAssetsAtCostOther = 0;
      data.otherFixAssetsAtCostTotal = 0;

      data.otherFixedAssetAccumulatedDep = 0;
      data.otherFixedAssetAccumulatedDepOther = 0;
      data.otherFixedAssetAccumulatedDepTotal = 0;

      data.sofeAsset = 0;
      data.sofeAssetOther = 0;
      data.sofeAssetTotal = 0;

      data.sofeAssetValue = 0;
      data.sofeAssetValueOther = 0;
      data.sofeAssetValueTotal = 0;

      data.sofeAssetAccumulatedDep = 0;
      data.sofeAssetAccumulatedDepOther = 0;
      data.sofeAssetAccumulatedDepTotal = 0;

      data.fixAssetReceivable = 0;
      data.fixAssetReceivableOther = 0;
      data.fixAssetReceivableTotal = 0;

      data.chapter = 0;
      data.chapterOther = 0;
      data.chapterTotal = 0;

      data.otherFix = 0;
      data.otherFixOther = 0;
      data.otherFixTotal = 0;

      data.totalAsset = 0;
      data.totalAssetOther = 0;
      data.totalAssetTotal = 0;


      /*
       * Liability
       *
       * */


      data.owingNBCandOther = 0;
      data.owingNBCandOtherOther = 0;
      data.owingNBCandOtherTotal = 0;

      data.owingNBC = 0;
      data.owingNBCOther = 0;
      data.owingNBCTotal = 0;

      data.owingNBCLessThanMonth = 0;
      data.owingNBCLessThanMonthOther = 0;
      data.owingNBCLessThanMonthTotal = 0;

      data.owingOther = 0;
      data.owingOtherOther = 0;
      data.owingOtherTotal = 0;

      data.owingOtherLessThanMonth = 0;
      data.owingOtherLessThanMonthOther = 0;
      data.owingOtherLessThanMonthTotal = 0;

      data.interestNBC = 0;
      data.interestNBCOther = 0;
      data.interestNBCTotal = 0;


      data.customerDeposit = 0;
      data.customerDepositOther = 0;
      data.customerDepositTotal = 0;

      data.compulsorySaving = 0;
      data.compulsorySavingOther = 0;
      data.compulsorySavingTotal = 0;

      data.voluntarySaving = 0;
      data.voluntarySavingOther = 0;
      data.voluntarySavingTotal = 0;

      data.savingDeposit = 0;
      data.savingDepositOther = 0;
      data.savingDepositTotal = 0;

      data.demandDeposite = 0;
      data.demandDepositeOther = 0;
      data.demandDepositeTotal = 0;


      data.termDeposite = 0;
      data.termDepositeOther = 0;
      data.termDepositeTotal = 0;


      data.interestPayable = 0;
      data.interestPayableOther = 0;
      data.interestPayableTotal = 0;

      data.accountsPayableAndOtherLiabilities = 0;
      data.accountsPayableAndOtherLiabilitiesOther = 0;
      data.accountsPayableAndOtherLiabilitiesTotal = 0;

      data.accountPayable = 0;
      data.accountPayableOther = 0;
      data.accountPayableTotal = 0;

      data.interestPay = 0;
      data.interestPayOther = 0;
      data.interestPayTotal = 0;

      data.taxPay = 0;
      data.taxPayOther = 0;
      data.taxPayTotal = 0;

      data.otherFixedAsset = 0;
      data.otherFixedAssetOther = 0;
      data.otherFixedAssetTotal = 0;

      data.shareHolder = 0;
      data.shareHolderOther = 0;
      data.shareHolderTotal = 0;


      /*
       * Equity
       * */
      data.paidUpCapital = 0;
      data.paidUpCapitalOther = 0;
      data.paidUpCapitalTotal = 0;

      data.premiumOnShareCapital = 0;
      data.premiumOnShareCapitalOther = 0;
      data.premiumOnShareCapitalTotal = 0;

      data.unPremiumOnShareCapital = 0;
      data.unPremiumOnShareCapitalOther = 0;
      data.unPremiumOnShareCapitalTotal = 0;

      data.littleAP = 0;
      data.littleAPOther = 0;
      data.littleAPTotal = 0;

      data.reservesAndAppropriations = 0;
      data.reservesAndAppropriationsOther = 0;
      data.reservesAndAppropriationsTotal = 0;


      data.retainedEarning = 0;
      data.retainedEarningOther = 0;
      data.retainedEarningTotal = 0;

      data.netIncome = 0;
      data.netIncomeOther = 0;
      data.netIncomeTotal = 0;

      data.donatedCapitalNet = 0;
      data.donatedCapitalNetOther = 0;
      data.donatedCapitalNetTotal = 0;

      data.donatedCapital = 0;
      data.donatedCapitalOther = 0;
      data.donatedCapitalTotal = 0;

      data.hybridCapitalInvestment = 0;
      data.hybridCapitalInvestmentOther = 0;
      data.hybridCapitalInvestmentTotal = 0;


      data.totalLiabilitiesAndEquity = 0;
      data.totalLiabilitiesAndEquityOther = 0;
      data.totalLiabilitiesAndEquityTotal = 0;

      var accountCode = "";
      var selectorNbcCode = {};

      result.forEach(function (obj) {

        /*
         * Assets
         * */
        accountCode = obj.code.substr(0, 6);

        selectorNbcCode['transaction.accountDoc.code'] = new RegExp("^" +
            accountCode, "m");
        var nbcCode = MapNBCBalanceKH.findOne(
            selectorNbcCode);

        if (nbcCode != null) {
          if (nbcCode.accountDocNBC.code == "1.1") {
            data.cashOnHand += obj.amountRiel / 1000000;
            data.cashOnHandOther += (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "1.2") {
            data.balanceNBC += obj.amountRiel / 1000000;
            data.balanceNBCOther += (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "1.3") {
            data.accountBank += obj.amountRiel / 1000000;
            data.accountBankOther += (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "1.4") {
            data.interestReceivable += obj.amountRiel / 1000000;
            data.interestReceivableOther += (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "2.1.1") {
            data.creditBalanceLessThanOneMonth += obj.amountRiel / 1000000;
            data.creditBalanceLessThanOneMonthOther += (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "2.1.2") {
            data.loanLossReverse += obj.amountRiel / 1000000;
            data.loanLossReverseOther += (obj.amountUsd + obj.amountThb) /
                1000000;

          } else if (nbcCode.accountDocNBC.code == "2.2") {
            data.netCreditBalance += obj.amountRiel / 1000000;
            data.netCreditBalanceOther += (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "2.3") {
            data.interestReceivableCredit += obj.amountRiel / 1000000;
            data.interestReceivableCreditOther += (obj.amountUsd + obj.amountThb) /
                1000000;
          }


          else if (nbcCode.accountDocNBC.code == "3.1.1") {
            data.land += obj.amountRiel / 1000000;
            data.landOther += (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "3.1.2") {
            data.landAccumulatedDep += obj.amountRiel / 1000000;
            data.landAccumulatedDepOther += (obj.amountUsd + obj.amountThb) / 1000000;
          } else if (nbcCode.accountDocNBC.code == "3.2.1") {
            data.buildingAtCost += obj.amountRiel / 1000000;
            data.buildingAtCostOther += (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "3.2.2") {
            data.buildingAccumulatedDep += obj.amountRiel / 1000000;
            data.buildingAccumulatedDepOther += (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "3.3.1") {
            data.otherFixAssetsAtCost += obj.amountRiel / 1000000;
            data.otherFixAssetsAtCostOther += (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "3.3.2") {
            data.otherFixedAssetAccumulatedDep += obj.amountRiel / 1000000;
            data.otherFixedAssetAccumulatedDepOther += (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "3.4.1") {
            data.sofeAssetValue += obj.amountRiel /
                1000000;
            data.sofeAssetValueOther += (obj.amountUsd +
                obj.amountThb) / 1000000;
          } else if (nbcCode.accountDocNBC.code == "3.4.2") {
            data.sofeAssetAccumulatedDep += obj.amountRiel / 1000000;
            data.sofeAssetAccumulatedDepOther += (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "4.1") {
            data.chapter += obj.amountRiel / 1000000;
            data.chapterOther += (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "4.2") {
            data.otherFix += obj.amountRiel / 1000000;
            data.otherFixOther += (obj.amountUsd + obj.amountThb) /
                1000000;
          }

          /*
           * Liability
           * */
          else if (nbcCode.accountDocNBC.code == "5.1.1") {
            data.owingNBC += (-1) * obj.amountRiel / 1000000;
            data.owingNBCOther += (-1) * (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "5.2.1") {
            data.owingNBCLessThanMonth += (-1) * obj.amountRiel / 1000000;
            data.owingNBCLessThanMonthOther += (-1) * (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "5.3") {
            data.interestNBC += (-1) * obj.amountRiel / 1000000;
            data.interestNBCOther += (-1) * (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "6.1") {
            data.compulsorySaving += (-1) * obj.amountRiel / 1000000;
            data.compulsorySavingOther += (-1) * (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "6.2.1") {
            data.savingDeposit += (-1) * obj.amountRiel / 1000000;
            data.savingDepositOther += (-1) * (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "6.2.2") {
            data.demandDeposite += (-1) * obj.amountRiel / 1000000;
            data.demandDepositeOther += (-1) * (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "6.2.3") {
            data.termDeposite += (-1) * obj.amountRiel / 1000000;
            data.termDepositeOther += (-1) * (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "6.3") {
            data.interestPayable += (-1) * obj.amountRiel /
                1000000;
            data.interestPayableOther += (-1) * (obj
                    .amountUsd + obj.amountThb) / 1000000;
          } else if (nbcCode.accountDocNBC.code == "7.1") {
            data.accountPayable += (-1) * obj.amountRiel /
                1000000;
            data.accountPayableOther += (-1) * (obj.amountUsd +
                obj.amountThb) / 1000000;
          } else if (nbcCode.accountDocNBC.code == "7.2") {
            data.interestPay += (-1) * obj.amountRiel /
                1000000;
            data.interestPayOther += (-1) * (obj.amountUsd +
                obj.amountThb) / 1000000;
          } else if (nbcCode.accountDocNBC.code == "7.3") {
            data.taxPay += (-1) * obj.amountRiel / 1000000;
            data.taxPayOther += (-1) * (obj.amountUsd +
                obj.amountThb) / 1000000;
          } else if (nbcCode.accountDocNBC.code == "7.4") {
            data.otherFixedAsset += (-1) * obj.amountRiel / 1000000;
            data.otherFixedAssetOther += (-1) * (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "8.1.1") {
            data.premiumOnShareCapital += (-1) * obj.amountRiel / 1000000;
            data.premiumOnShareCapitalOther += (-1) * (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "8.1.2") {
            data.unPremiumOnShareCapital += (-1) * obj.amountRiel / 1000000;
            data.unPremiumOnShareCapitalOther += (-1) * (obj.amountUsd + obj.amountThb) /
                1000000;
          }
          else if (nbcCode.accountDocNBC.code == "8.2") {
            data.littleAP += (-1) * obj.amountRiel / 1000000;
            data.littleAPOther += (-1) * (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "8.3") {
            data.reservesAndAppropriations += (-1) * obj.amountRiel /
                1000000;
            data.reservesAndAppropriationsOther += (-1) * (obj.amountUsd +
                obj.amountThb) / 1000000;
          } else if (nbcCode.accountDocNBC.code == "8.4") {
            data.retainedEarning += (-1) * obj.amountRiel / 1000000;
            data.retainedEarningOther += (-1) * (obj.amountUsd + obj.amountThb) /
                1000000;
          } else if (nbcCode.accountDocNBC.code == "8.5") {
            data.netIncome += (-1) * obj.amountRiel /
                1000000;
            data.netIncomeOther += (-1) * (obj.amountUsd +
                obj.amountThb) / 1000000;
          } else if (nbcCode.accountDocNBC.code == "8.6.1") {
            data.donatedCapital += (-1) * obj.amountRiel /
                1000000;
            data.donatedCapitalOther += (-1) * (obj.amountUsd +
                obj.amountThb) / 1000000;
          } else if (nbcCode.accountDocNBC.code == "8.6.2") {
            data.hybridCapitalInvestment += (-1) * obj.amountRiel / 1000000;
            data.hybridCapitalInvestmentOther += (-1) * (obj.amountUsd + obj.amountThb) /
                1000000;
          }
        }

      });

      /*
       * Assets
       * */
      data.cashOnHandTotal = math.round(data.cashOnHand, 3) + math.round(
              data.cashOnHandOther, 3);
      data.balanceNBCTotal = math.round(data.balanceNBC, 3) + math.round(
              data.balanceNBCOther, 3);
      data.accountBankTotal = math.round(data.accountBank, 3) + math.round(
              data.accountBankOther, 3);

      data.interestReceivableTotal = math.round(data.interestReceivable, 3) +
          math.round(data.interestReceivableOther, 3);


      data.creditBalanceLessThanOneMonthTotal = math.round(data.creditBalanceLessThanOneMonth,
              2) + math.round(data.creditBalanceLessThanOneMonthOther, 3);

      data.loanLossReverseTotal = math.round(data.loanLossReverse, 3) +
          math.round(data.loanLossReverseOther, 3);

      data.netCreditBalanceTotal = math.round(data.netCreditBalance,
              2) + math.round(data.netCreditBalanceOther, 3);

      data.interestReceivableCreditTotal = math.round(data.interestReceivableCredit, 3) + math.round(
              data.interestReceivableCreditOther, 3);

      data.landTotal = math.round(data.land,
              2) + math.round(data.landOther, 3);


      data.landAccumulatedDepTotal = math.round(data.landAccumulatedDep, 3) +
          math.round(data.landAccumulatedDepOther, 3);

      data.buildingAtCostTotal = math.round(data.buildingAtCost, 3) + math.round(
              data.buildingAtCostOther, 3);
      data.buildingAccumulatedDepTotal = math.round(data.buildingAccumulatedDep,
              2) + math.round(data.buildingAccumulatedDepOther, 3);

      data.otherFixAssetsAtCostTotal = math.round(data.otherFixAssetsAtCost,
              2) + math.round(data.otherFixAssetsAtCostOther, 3);

      data.otherFixedAssetAccumulatedDepTotal = math.round(data.otherFixedAssetAccumulatedDep,
              2) + math.round(data.otherFixedAssetAccumulatedDepOther, 3);

      data.sofeAssetValueTotal = math.round(data.sofeAssetValue, 3) + math.round(
              data.sofeAssetValueOther, 3);

      data.sofeAssetAccumulatedDepTotal = math.round(data.sofeAssetAccumulatedDep, 3) + math.round(
              data.sofeAssetAccumulatedDepOther, 3);

      data.chapterTotal = math.round(data.chapter, 3) + math.round(
              data.chapterOther, 3);

      data.otherFixTotal = math.round(data.otherFix, 3) + math.round(
              data.otherFixOther, 3);


      data.cashAndBalanceWithNBC = math.round(math.round(data.cashOnHand, 3) +
          math.round(data.balanceNBC, 3) + math.round(data.accountBank, 3) +
          math.round(data.interestReceivable, 3), 3);
      data.cashAndBalanceWithNBCOther = math.round(math.round(data.cashOnHandOther,
              2) + math.round(data.balanceNBCOther, 3) + math.round(data.accountBankOther,
              2) + math.round(data.interestReceivableOther, 3), 3);
      data.cashAndBalanceWithNBCTotal = math.round(math.round(data.cashOnHandTotal,
              2) + math.round(data.balanceNBCTotal, 3) + math.round(data.accountBankTotal,
              2) + math.round(data.interestReceivableTotal, 3), 3);

      data.creditBalance = math.round(math.round(data.creditBalanceLessThanOneMonth, 3) +
          math.round(data.loanLossReverse, 3), 3);
      data.creditBalanceOther = math.round(math.round(data.creditBalanceLessThanOneMonthOther, 3) +
          math.round(data.loanLossReverseOther, 3), 3);
      data.creditBalanceTotal = math.round(math.round(data.creditBalanceLessThanOneMonthTotal, 3) +
          math.round(data.loanLossReverseTotal, 3), 3);


      data.loanAndAdvancedToCustomer = math.round(math.round(data.creditBalance,
              2) + math.round(data.netCreditBalance, 3) + math.round(data.interestReceivableCredit,
              2), 3);
      data.loanAndAdvancedToCustomerOther = math.round(math.round(data.creditBalanceOther,
              2) + math.round(data.netCreditBalanceOther, 3) + math.round(data.interestReceivableCreditOther,
              2), 3);
      data.loanAndAdvancedToCustomerTotal = math.round(math.round(data.creditBalanceTotal,
              2) + math.round(data.netCreditBalanceTotal, 3) + math.round(data.interestReceivableCreditTotal,
              2), 3);


      data.landNet = math.round(math.round(data.land, 3) + math.round(data.landAccumulatedDep),
          2);
      data.landNetOther = math.round(math.round(data.landOther, 3) + math.round(
              data.landAccumulatedDepOther), 3);
      data.landNetTotal = math.round(math.round(data.landTotal, 3) + math.round(
              data.landAccumulatedDepTotal), 3);

      data.buildingNet = math.round(math.round(data.buildingAtCost, 3) +
          math.round(data.buildingAccumulatedDep, 3), 3);
      data.buildingNetOther = math.round(math.round(data.buildingAtCostOther,
              2) + math.round(data.buildingAccumulatedDepOther, 3), 3);
      data.buildingNetTotal = math.round(math.round(data.buildingAtCostTotal,
              2) + math.round(data.buildingAccumulatedDepTotal, 3), 3);

      data.otherFixAssetNet = math.round(math.round(data.otherFixAssetsAtCost,
              2) + math.round(data.otherFixedAssetAccumulatedDep, 3), 3);
      data.otherFixAssetNetOther = math.round(math.round(data.otherFixAssetsAtCostOther,
              2) + math.round(data.otherFixedAssetAccumulatedDepOther, 3), 3);
      data.otherFixAssetNetTotal = math.round(math.round(data.otherFixAssetsAtCostTotal,
              2) + math.round(data.otherFixedAssetAccumulatedDepTotal, 3), 3);


      data.sofeAsset = math.round(math.round(data.sofeAssetValue,
              2) + math.round(data.sofeAssetAccumulatedDep, 3), 3);
      data.sofeAssetOther = math.round(math.round(data.sofeAssetValueOther,
              2) + math.round(data.sofeAssetAccumulatedDepOther, 3), 3);
      data.sofeAssetTotal = math.round(math.round(data.sofeAssetValueTotal,
              2) + math.round(data.sofeAssetAccumulatedDepTotal, 3), 3);


      data.propertyAndEquipment = math.round(math.round(data.landNet, 3) +
          math.round(data.buildingNet, 3) + math.round(data.otherFixAssetNet,
              2) + math.round(data.sofeAsset, 3), 3);
      data.propertyAndEquipmentOther = math.round(math.round(data.landNetOther,
              2) + math.round(data.buildingNetOther, 3) + math.round(data.otherFixAssetNetOther,
              2) + math.round(data.sofeAssetOther, 3), 3);
      data.propertyAndEquipmentTotal = math.round(math.round(data.landNetTotal,
              2) + math.round(data.buildingNetTotal, 3) + math.round(data.otherFixAssetNetTotal,
              2) + math.round(data.sofeAssetTotal, 3), 3);

      data.fixAssetReceivable = math.round(math.round(data.chapter,
              2) + math.round(data.otherFix, 3), 3);
      data.fixAssetReceivableOther = math.round(math.round(data.chapterOther,
              2) + math.round(data.otherFixOther, 3), 3);
      data.fixAssetReceivableTotal = math.round(math.round(data.chapterTotal,
              2) + math.round(data.otherFixTotal, 3), 3);

      data.totalAsset = math.round(data.cashAndBalanceWithNBC, 3) + math.round(
              data.loanAndAdvancedToCustomer, 3) + math.round(data.propertyAndEquipment,
              2) + math.round(data.fixAssetReceivable, 3);
      data.totalAssetOther = math.round(data.cashAndBalanceWithNBCOther, 3) + math.round(
              data.loanAndAdvancedToCustomerOther, 3) + math.round(data.propertyAndEquipmentOther,
              2) + math.round(data.fixAssetReceivableOther, 3);
      data.totalAssetTotal = math.round(data.cashAndBalanceWithNBCTotal, 3) + math.round(
              data.loanAndAdvancedToCustomerTotal, 3) + math.round(data.propertyAndEquipmentTotal,
              2) + math.round(data.fixAssetReceivableTotal, 3);


      /*
       * Liability
       * */

      data.owingNBCLessThanMonthTotal = math.round(data.owingNBCLessThanMonth, 3) + math.round(data.owingNBCLessThanMonthOther, 3);
      data.owingOtherLessThanMonthTotal = math.round(data.owingOtherLessThanMonth, 3) + math.round(data.owingOtherLessThanMonthOther, 3);
      data.interestNBCTotal = math.round(data.interestNBC, 3) + math.round(data.interestNBCOther, 3);


      data.owingNBC = math.round(data.owingNBCLessThanMonth, 3);
      data.owingNBCOther = math.round(data.owingNBCLessThanMonthOther, 3);
      data.owingNBCTotal = math.round(data.owingNBCLessThanMonthTotal, 3);

      data.owingOther = math.round(data.owingOtherLessThanMonth, 3);
      data.owingOtherOther = math.round(data.owingOtherLessThanMonthOther, 3);
      data.owingOtherTotal = math.round(data.owingOtherLessThanMonthTotal, 3);

      data.owingNBCandOther = (math.round(data.owingNBC, 3) +
      math.round(data.owingOther, 3) + math.round(data.interestNBC, 3));
      data.owingNBCandOtherOther = (math.round(data.owingNBCOther, 3) +
      math.round(data.owingOtherOther, 3) + math.round(data.interestNBCOther, 3));
      data.owingNBCandOtherTotal = (math.round(data.owingNBCTotal, 3) +
      math.round(data.owingOtherTotal, 3) + math.round(data.interestNBCTotal, 3));


      data.compulsorySavingTotal = (math.round(data.compulsorySaving, 3) +
      math.round(data.compulsorySavingOther, 3));
      data.savingDepositTotal = (math.round(data.savingDeposit, 3) + math.round(
          data.savingDepositOther, 3));
      data.demandDepositeTotal = (math.round(data.demandDeposite, 3) + math
          .round(data.demandDepositeOther, 3));
      data.termDepositeTotal = (math.round(data.termDeposite, 3) + math.round(
          data.termDepositeOther, 3));

      data.interestPayableTotal = (math.round(data.interestPayable, 3) +
      math.round(data.interestPayableOther, 3));
      data.accountPayableTotal = (math.round(data.accountPayable,
          2) + math.round(data.accountPayableOther, 3));
      data.interestPayTotal = (math.round(data.interestPay,
          2) + math.round(data.interestPayOther, 3));

      data.taxPayTotal = (math.round(data.taxPay,
          2) + math.round(data.taxPayOther, 3));

      data.otherFixedAssetTotal = (math.round(data.otherFixedAsset,
          2) + math.round(data.otherFixedAssetOther, 3));


      data.premiumOnShareCapitalTotal = (math.round(data.premiumOnShareCapital, 3) +
      math.round(data.premiumOnShareCapitalOther, 3));
      data.unPremiumOnShareCapitalTotal = (math.round(data.unPremiumOnShareCapital, 3) +
      math.round(data.unPremiumOnShareCapitalOther, 3));

      data.littleAPTotal = (math.round(data.littleAP, 3) + math
          .round(data.littleAPOther, 3));
      data.reservesAndAppropriationsTotal = (math.round(data.reservesAndAppropriations, 3) + math
          .round(data.reservesAndAppropriationsOther, 3));

      data.retainedEarningTotal = (math.round(data.retainedEarning, 3) + math
          .round(data.retainedEarningOther, 3));


      data.donatedCapitalTotal = (math.round(data.donatedCapital, 3) + math
          .round(data.donatedCapitalOther, 3));
      data.hybridCapitalInvestmentTotal = (math.round(data.hybridCapitalInvestment, 3) + math
          .round(data.hybridCapitalInvestmentOther, 3));


      data.owingNBCandOther = math.round(data.owingNBC, 3) + math.round(
              data.owingOther, 3) + math.round(data.interestNBC, 3);
      data.owingNBCandOtherOther = math.round(data.owingNBCOther, 3) + math.round(
              data.owingOtherOther, 3) + math.round(data.interestNBCOther, 3);
      data.owingNBCandOtherTotal = math.round(data.owingNBCTotal, 3) + math.round(
              data.owingOtherTotal, 3) + math.round(data.interestNBCTotal, 3);


      data.voluntarySaving = math.round(data.savingDeposit, 3) + math.round(
              data.demandDeposite, 3) + math.round(data.termDeposite, 3);
      data.voluntarySavingOther = math.round(data.savingDepositOther, 3) +
          math.round(data.demandDepositeOther, 3) + math.round(data.termDepositeOther,
              2);
      data.voluntarySavingTotal = math.round(data.savingDepositTotal, 3) +
          math.round(data.demandDepositeTotal, 3) + math.round(data.termDepositeTotal,
              2);


      data.customerDeposit = math.round(data.compulsorySaving, 3) + math.round(
              data.voluntarySaving, 3) + math.round(data.interestPayable, 3);
      data.customerDepositOther = math.round(data.compulsorySavingOther, 3) +
          math.round(data.voluntarySavingOther, 3) + math.round(data.interestPayableOther,
              2);
      data.customerDepositTotal = math.round(data.compulsorySavingTotal, 3) +
          math.round(data.voluntarySavingTotal, 3) + math.round(data.interestPayableTotal,
              2);


      data.accountsPayableAndOtherLiabilities = math.round(data.accountPayable, 3) + math.round(
              data.interestPay, 3) + math.round(data.taxPay, 3) + math.round(data.otherFixedAsset, 3);
      data.accountsPayableAndOtherLiabilitiesOther = math.round(data.accountPayableOther, 3) + math.round(
              data.interestPayOther, 3) + math.round(data.taxPayOther, 3) + math.round(data.otherFixedAssetOther, 3);
      data.accountsPayableAndOtherLiabilitiesTotal = math.round(data.accountPayableTotal, 3) + math.round(
              data.interestPayTotal, 3) + math.round(data.taxPayTotal, 3) + math.round(data.otherFixedAssetTotal, 3);


      data.paidUpCapital = (math.round(data.premiumOnShareCapital, 3) + math.round(
          data.unPremiumOnShareCapital, 3));
      data.paidUpCapitalOther = (math.round(data.premiumOnShareCapitalOther, 3) + math.round(
          data.unPremiumOnShareCapitalOther, 3));
      data.paidUpCapitalTotal = (math.round(data.premiumOnShareCapitalTotal, 3) + math.round(
          data.unPremiumOnShareCapitalTotal, 3));


      data.donatedCapitalNet = (math.round(data.donatedCapital,
          2) + math.round(data.hybridCapitalInvestment, 3));
      data.donatedCapitalNetOther = (math.round(data.donatedCapitalOther,
          2) + math.round(data.hybridCapitalInvestmentOther, 3));
      data.donatedCapitalNetTotal = (math.round(data.donatedCapitalTotal,
          2) + math.round(data.hybridCapitalInvestmentTotal, 3));


      data.netIncomeOther = math.round((contentProfit.profitUSD +
          contentProfit.profitB) / 1000000, 3);
      data.netIncome = math.round(contentProfit.profitR / 1000000, 3);
      data.netIncomeTotal = math.round(contentProfit.profit / 1000000, 3);


      data.shareHolder = math.round(data.paidUpCapital,
              2) + math.round(data.littleAP, 3)
          + math.round(data.reservesAndAppropriations, 3)
          + math.round(data.retainedEarning, 3)
          + math.round(data.netIncome, 3)
          + math.round(data.donatedCapitalNet, 3);
      data.shareHolderOther = math.round(data.paidUpCapitalOther,
              2) + math.round(data.littleAPOther, 3)
          + math.round(data.reservesAndAppropriationsOther, 3)
          + math.round(data.retainedEarningOther, 3)
          + math.round(data.netIncomeOther, 3)
          + math.round(data.donatedCapitalNetOther, 3);
      data.shareHolderTotal = math.round(data.paidUpCapitalTotal,
              2) + math.round(data.littleAPTotal, 3)
          + math.round(data.reservesAndAppropriationsTotal, 3)
          + math.round(data.retainedEarningTotal, 3)
          + math.round(data.netIncomeTotal, 3)
          + math.round(data.donatedCapitalNetTotal, 3);


      data.totalLiabilitiesAndEquity = math.round(data.owingNBCandOther, 3) +
          math.round(data.customerDeposit, 3) +
          math.round(data.accountsPayableAndOtherLiabilities, 3) +
          math.round(data.shareHolder, 3);
      data.totalLiabilitiesAndEquityOther = math.round(data.owingNBCandOtherOther, 3) +
          math.round(data.customerDepositOther, 3) +
          math.round(data.accountsPayableAndOtherLiabilitiesOther, 3) +
          math.round(data.shareHolderOther, 3);
      data.totalLiabilitiesAndEquityTotal = math.round(data.owingNBCandOtherTotal, 3) +
          math.round(data.customerDepositTotal, 3) +
          math.round(data.accountsPayableAndOtherLiabilitiesTotal, 3) +
          math.round(data.shareHolderTotal, 3);


      var compare = math.round(data.totalAssetTotal, 3) - math.round(data.totalLiabilitiesAndEquityTotal, 3);
      if (math.abs(compare) < 0.05) {
        data.totalLiabilitiesAndEquityTotal = data.totalAssetTotal;
        data.totalLiabilitiesAndEquityOther = data.totalLiabilitiesAndEquityOther + compare;

        data.donatedCapitalNetTotal = data.donatedCapitalNetTotal + compare;
        data.donatedCapitalNetOther = data.donatedCapitalNetOther + compare;

        data.hybridCapitalInvestmentTotal = data.hybridCapitalInvestmentTotal + compare;
        data.hybridCapitalInvestmentOther = data.hybridCapitalInvestmentOther + compare;
      }
      return data;
    }
  }
});
