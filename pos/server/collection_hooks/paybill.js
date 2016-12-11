import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';
import {PayBills} from '../../imports/api/collections/payBill';
import {Invoices} from '../../imports/api/collections/invoice';
import {Item} from '../../imports/api/collections/item.js';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js';
import {AccountMapping} from '../../imports/api/collections/accountMapping.js'
PayBills.before.insert(function (userId, doc) {
    doc._id = idGenerator.genWithPrefix(PayBills, `${doc.branchId}-`, 9);
});

PayBills.after.remove(function (userId, doc) {
    Meteor.call('insertRemovedPayBill', doc);
});

PayBills.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "PayBill";
            let apChartAccount = AccountMapping.findOne({name: 'A/P'});
            let cashChartAccount = AccountMapping.findOne({name: 'Cash on Hand'});
            let purchaseDiscountChartAccount = AccountMapping.findOne({name: 'Purchase Discount'});
            let discountAmount = doc.dueAmount * doc.discount / 100;
            data.total = doc.paidAmount + discountAmount;
            transaction.push({
                account: apChartAccount.account,
                dr: doc.paidAmount + discountAmount,
                cr: 0,
                drcr: doc.paidAmount + discountAmount
            }, {
                account: cashChartAccount.account,
                dr: 0,
                cr: doc.paidAmount,
                drcr: -doc.paidAmount
            });
            if (discountAmount > 0) {
                transaction.push({
                    account: purchaseDiscountChartAccount.account,
                    dr: 0,
                    cr: discountAmount,
                    drcr: -discountAmount
                });
            }
            /*  let invoice = Invoices.findOne(doc.invoiceId);
             let firstItem = invoice.items[0];
             let itemDoc = Item.findOne(firstItem.itemId);
             invoice.items.forEach(function (item) {
             let itemDoc = Item.findOne(item.itemId);
             if (itemDoc.accountMapping.accountReceivable && itemDoc.accountMapping.inventoryAsset) {
             transaction.push({
             account: itemDoc.accountMapping.accountReceivable,
             dr: item.amount,
             cr: 0,
             drcr: item.amount
             }, {
             account: itemDoc.accountMapping.inventoryAsset,
             dr: 0,
             cr: item.amount,
             drcr: -item.amount
             })
             }
             });*/
            data.transaction = transaction;
            Meteor.call('insertAccountJournal', data);
            console.log(data);
        }
        //End Account Integration
    });
})

PayBills.after.update(function (userId, doc) {
    Meteor.defer(function () {
        console.log(doc);
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "PayBill";
            let apChartAccount = AccountMapping.findOne({name: 'A/P'});
            let cashChartAccount = AccountMapping.findOne({name: 'Cash on Hand'});
            let purchaseDiscountChartAccount = AccountMapping.findOne({name: 'Purchase Discount'});
            let discountAmount = doc.dueAmount * doc.discount / 100;
            data.total = doc.paidAmount + discountAmount;
            transaction.push({
                account: apChartAccount.account,
                dr: doc.paidAmount + discountAmount,
                cr: 0,
                drcr: doc.paidAmount + discountAmount
            }, {
                account: cashChartAccount.account,
                dr: 0,
                cr: doc.paidAmount,
                drcr: -doc.paidAmount
            });
            if (discountAmount > 0) {
                transaction.push({
                    account: purchaseDiscountChartAccount.account,
                    dr: 0,
                    cr: +discountAmount,
                    drcr: -+discountAmount
                });
            }
            /*  let invoice = Invoices.findOne(doc.invoiceId);
             let firstItem = invoice.items[0];
             let itemDoc = Item.findOne(firstItem.itemId);
             invoice.items.forEach(function (item) {
             let itemDoc = Item.findOne(item.itemId);
             if (itemDoc.accountMapping.accountReceivable && itemDoc.accountMapping.inventoryAsset) {
             transaction.push({
             account: itemDoc.accountMapping.accountReceivable,
             dr: item.amount,
             cr: 0,
             drcr: item.amount
             }, {
             account: itemDoc.accountMapping.inventoryAsset,
             dr: 0,
             cr: item.amount,
             drcr: -item.amount
             })
             }
             });*/
            data.transaction = transaction;
            Meteor.call('updateAccountJournal', data);
        }
        //End Account Integration
    });
});

PayBills.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let data = {_id: doc._id, type: 'PayBill'};
            Meteor.call('removeAccountJournal', data);
        }
        //End Account Integration
    })
});