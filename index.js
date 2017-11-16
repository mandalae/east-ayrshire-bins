'use strict';
const Alexa = require('alexa-sdk');

const findEvent = require('./findEvent')

const handlers = {
    'LaunchRequest': function() {
        this.emit('GetBuildStatus');
    },
    'WhichBinTomorrow': function() {
        console.log('Running which bin tomorrow');
        findEvent(true).then(result => {
            this.emit(':tell', result);
        }).catch(err => {
            this.emit(':tell', err);
        });
    },
    'NextBin': function(){
        console.log('Running next bin');
        findEvent(false, true).then(result => {
            this.emit(':tell', result);
        }).catch(err => {
            this.emit(':tell', err);
        });
    },
    'WhenIsBin': function() {
        const binType = this.event.request.intent.slots.binType.value;
        console.log('Running when is bin:', binType);
        findEvent(false, false, binType).then(result => {
            this.emit(':tell', result);
        }).catch(err => {
            this.emit(':tell', err);
        });

    },
    'Unhandled': function() {
        this.emit(':tell', 'Something went wrong, try again');
    }
}

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
}
