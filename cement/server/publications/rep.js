import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {Reps} from '../../imports/api/collections/rep.js';

Meteor.publish('cement.rep', function cementRep(selector, options) {
    this.unblock();
    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});
    if (this.userId) {
        let data = Reps.find(selector, options);
        return data;
    }
    return this.ready();
});

// Reactive Table
