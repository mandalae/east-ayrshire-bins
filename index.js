'use strict';
const Alexa = require('alexa-sdk');

const findEventAPI = require('./src/findEventAPI')

const handlers = {
    'LaunchRequest': function() {
        this.emit('NextBin');
    },
    'WhichBinTomorrow': function() {
        console.log('Running which bin tomorrow');
        findEventAPI(this, 'tomorrow').then(result => {
            this.emit(':tell', result);
        }).catch(err => {
            if (typeof err == "object"){
                this.emit(':tellWithPermissionCard', err.tellWithPermissionCard, err.permissions);
            } else {
                console.log(err);
                this.emit(':tell', err);
            }
        });
    },
    'NextBin': function(){
        console.log('Running next bin');
        findEventAPI(this, 'nextBin').then(result => {
            this.emit(':tell', result);
        }).catch(err => {
            if (typeof err == "object"){
                this.emit(':tellWithPermissionCard', err.tellWithPermissionCard, err.permissions);
            } else {
                console.log(err);
                this.emit(':tell', err);
            }
        });
    },
    'WhenIsBin': function() {
        const binType = this.event.request.intent.slots.binType.value;
        console.log('Running when is bin:', binType);
        findEventAPI(this, 'binType', binType).then(result => {
            this.emit(':tell', result);
        }).catch(err => {
            if (typeof err == "object"){
                this.emit(':tellWithPermissionCard', err.tellWithPermissionCard, err.permissions);
            } else {
                console.log(err);
                this.emit(':tell', err);
            }
        });

    },
    'Unhandled': function() {
        this.emit(':tell', "I didn't understand that request, please try again.");
    },
    'AMAZON.HelpIntent': function () {
      // Handler for built-in HelpIntent
    },
    'AMAZON.StopIntent': function () {
      // Handler for the built-in StopIntent
    },
    'AMAZON.CancelIntent': function () {
      // Handler for the built-in CancelIntent
    }
}

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
}
