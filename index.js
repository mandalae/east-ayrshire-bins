'use strict';
const Alexa = require('alexa-sdk');

const findEventAPI = require('./src/findEventAPI')

const handlers = {
    'LaunchRequest': function() {
        this.emit('GetBuildStatus');
    },
    'WhichBinTomorrow': function() {
        console.log('Running which bin tomorrow');
        findEventAPI('tomorrow').then(result => {
            this.emit(':tell', result);
        }).catch(err => {
            this.emit(':tell', err);
        });
    },
    'NextBin': function(){
        console.log('Running next bin');
        findEventAPI('nextBin').then(result => {
            this.emit(':tell', result);
        }).catch(err => {
            this.emit(':tell', err);
        });
    },
    'WhenIsBin': function() {
        const binType = this.event.request.intent.slots.binType.value;
        console.log('Running when is bin:', binType);
        findEventAPI('binType', binType).then(result => {
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
