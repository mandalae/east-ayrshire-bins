const expect = require('chai').expect;
const chai = require('chai');
const proxyquire = require('proxyquire');
const chaiAsPromised = require("chai-as-promised");
const spies = require('chai-spies');

chai.use(chaiAsPromised);
chai.use(spies);

const getAlexaClientStub = (postalCode, address1) => {
    return class AlexaDeviceAddressClient {
        constructor(apiEndpoint, deviceId, consentToken) {
            this.deviceId = deviceId;
            this.consentToken = consentToken;
            this.endpoint = apiEndpoint.replace(/^https?:\/\//i, "");
        }

        getFullAddress() {
            return new Promise((fulfill, reject) => {
                fulfill({
                    address: {
                        addressLine1: address1,
                        postalCode: postalCode
                    }
                });
            });
        }
    }
}

describe('Find Event API', () => {

    let findEventAPI, alexa;

    beforeEach(() => {
        alexa = {
            event: {
                session: {
                    application: {
                        applicationId: 'amzn1.ask.skill.64dc032e-b923-433c-9acd-70937a3b0fbc'
                    }
                },
                context: {
                    System: {
                        user: {
                            permissions: {
                                consentToken: true
                            }
                        },
                        device: {
                            deviceId: 'some-id'
                        },
                        apiEndpoint: 'some-endpoint'
                    }
                }
            },
            emit: chai.spy()
        }
    });

    const alexaDeviceAddressClientStub = getAlexaClientStub('KA1 4SF', '453 Some street');

    it('should find an event for tomorrow', done => {
        const date = new Date("2017-12-14T00:00:00")
        const restAPICallResult = '{ "2017-12-15T00:00:00": "food bin and red box", "2017-12-18T00:00:00": "black box" }'

        const requestStub = (url, callback) => {
            callback(false, null, restAPICallResult)
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub, '../lib/AlexaDeviceAddressClient': alexaDeviceAddressClientStub });

        const findEventPromise = findEventAPI(alexa, 'tomorrow', null, date);
        expect(findEventPromise).to.be.fulfilled.then(data => {
            expect(data).to.equal("Tomorrow's collection is food bin and red box");
            done();
        });
    });

    it('should return an error if applicationId is unset', done => {
        const date = new Date("2017-12-14T00:00:00")
        const restAPICallResult = '{ "2017-12-15T00:00:00": "food bin and red box", "2017-12-18T00:00:00": "black box" }'

        const requestStub = (url, callback) => {
            callback(false, null, restAPICallResult)
        }

        alexa.event.session.application.applicationId = ''; // Simulate a no applicationId

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub, '../lib/AlexaDeviceAddressClient': alexaDeviceAddressClientStub });

        const findEventPromise = findEventAPI(alexa, 'tomorrow', null, date);
        expect(findEventPromise).to.be.rejectedWith("Your Alexa unit appears to have attempted to contact the wrong skill endpoint. Please contact support.").then(() => {
            done();
        });
    });

    it('should return an error if the address is unparsable', done => {
        const date = new Date("2017-12-14T00:00:00")
        const restAPICallResult = '{ "2017-12-15T00:00:00": "food bin and red box", "2017-12-18T00:00:00": "black box" }'

        const requestStub = (url, callback) => {
            callback(false, null, restAPICallResult)
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub, '../lib/AlexaDeviceAddressClient': getAlexaClientStub('KA1 4SF', 'Some street 5') });

        const findEventPromise = findEventAPI(alexa, 'tomorrow', null, date);
        expect(findEventPromise).to.be.rejectedWith("Unfortunately your address line 1 doesn't appear to have a house number in it. This skill requires that to find the correct information").then(() => {
            done();
        });
    });

    it('should return an error if the postcode is outside of East Ayrshire', done => {
        const date = new Date("2017-12-14T00:00:00")
        const restAPICallResult = '{ "2017-12-15T00:00:00": "food bin and red box", "2017-12-18T00:00:00": "black box" }'

        const requestStub = (url, callback) => {
            callback(false, null, restAPICallResult)
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub, '../lib/AlexaDeviceAddressClient': getAlexaClientStub('G5 4SF', '5 Some street') });

        const findEventPromise = findEventAPI(alexa, 'tomorrow', null, date);
        expect(findEventPromise).to.be.rejectedWith("Unfortunately your postcode doesn't appear to be a valid East Ayrshire postcode. If you believe this to be a mistake, please check and try again.").then(() => {
            done();
        });
    });

    it('should tell the user that we need permissions if they are not enabled', done => {
        const date = new Date("2017-12-03T00:00:00")
        const restAPICallResult = '{ "2017-12-15T00:00:00": "food bin and red box", "2017-12-18T00:00:00": "black box" }'

        const requestStub = (url, callback) => {
            callback(false, null, restAPICallResult)
        }

        alexa.event.context.System.user.permissions.consentToken = false; // Simulate a non enabled address

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub, '../lib/AlexaDeviceAddressClient': alexaDeviceAddressClientStub });

        const findEventPromise = findEventAPI(alexa, 'tomorrow', null, date);
        expect(findEventPromise).to.be.rejectedWith({
            tellWithPermissionCard: 'Please enable Location permissions for this skill in the Amazon Alexa app.',
            permissions: ["read::alexa:device:all:address"]
        }).then(() => {
            done();
        });

    });

    it('should tell the user that we need permissions if they are not enabled', done => {
        const date = new Date("2017-12-03T00:00:00")
        const restAPICallResult = '{ "2017-12-15T00:00:00": "food bin and red box", "2017-12-18T00:00:00": "black box" }'

        const requestStub = (url, callback) => {
            callback(false, null, restAPICallResult)
        }

        alexa.event.context.System.user = {}; // Simulate a non enabled address

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub, '../lib/AlexaDeviceAddressClient': alexaDeviceAddressClientStub });

        const findEventPromise = findEventAPI(alexa, 'tomorrow', null, date);
        expect(findEventPromise).to.be.rejectedWith({
            tellWithPermissionCard: 'Please enable Location permissions for this skill in the Amazon Alexa app.',
            permissions: ["read::alexa:device:all:address"]
        }).then(() => {
            done();
        });

    });

    it('should return a graceful error if no events tomorrow', done => {
        const date = new Date("2017-12-03T00:00:00")
        const restAPICallResult = '{ "2017-12-15T00:00:00": "food bin and red box", "2017-12-18T00:00:00": "black box" }'

        const requestStub = (url, callback) => {
            callback(false, null, restAPICallResult)
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub, '../lib/AlexaDeviceAddressClient': alexaDeviceAddressClientStub });

        const findEventPromise = findEventAPI(alexa, 'tomorrow', null, date);
        expect(findEventPromise).to.be.fulfilled.then(data => {
            expect(data).to.equal('There are no bins tomorrow');
            done();
        });
    });

    it('should only find one event', done => {
        const date = new Date("2017-12-14T00:00:00")
        const restAPICallResult = '{ "2017-12-15T00:00:00": "food bin and red box", "2017-12-18T00:00:00": "black box" }'

        const requestStub = (url, callback) => {
            callback(false, null, restAPICallResult)
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub, '../lib/AlexaDeviceAddressClient': alexaDeviceAddressClientStub });

        const findEventPromise = findEventAPI(alexa, 'tomorrow', null, date);
        expect(findEventPromise).to.be.fulfilled.then(data => {
            expect(data).to.equal("Tomorrow's collection is food bin and red box");
            done();
        });
    });

    it('should throw an error if http request fails', done => {
        const requestStub = (url, callback) => {
            callback('http error')
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub, '../lib/AlexaDeviceAddressClient': alexaDeviceAddressClientStub });

        const findEventPromise = findEventAPI(alexa, 'tomorrow');
        expect(findEventPromise).to.be.rejectedWith("I didn't understand that query, please try again.").then(() => {
            done();
        });
    });

    it('should find the next event', done => {
        const date = new Date("2018-02-18T00:00:00")
        const restAPICallResult = '{ "2017-12-15T00:00:00": "food bin and red box", "2018-02-19T00:00:00": "black box" }'

        const requestStub = (url, callback) => {
            callback(false, null, restAPICallResult)
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub, '../lib/AlexaDeviceAddressClient': alexaDeviceAddressClientStub });

        const findEventPromise = findEventAPI(alexa, 'nextBin', null, date);
        expect(findEventPromise).to.be.fulfilled.then(data => {

            expect(data).to.equal('Next collection is: black box on Monday<say-as interpret-as="date">????0219</say-as>');
            done();
        });
    });

    it('should find the next event, even the second one', done => {
        const date = new Date("2017-12-15T00:00:00")
        const restAPICallResult = '{ "2017-12-15T00:00:00": "food bin and red box", "2017-12-18T00:00:00": "black box" }'

        const requestStub = (url, callback) => {
            callback(false, null, restAPICallResult)
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub, '../lib/AlexaDeviceAddressClient': alexaDeviceAddressClientStub });

        const findEventPromise = findEventAPI(alexa, 'nextBin', null, date);
        expect(findEventPromise).to.be.fulfilled.then(data => {

            expect(data).to.equal('Next collection is: black box on Monday<say-as interpret-as="date">????1218</say-as>');
            done();
        });
    });

    it('should fail gracefully if it doesn\'t find the next bin', done => {
        const date = new Date("2017-12-18T00:00:00")
        const restAPICallResult = '{ "2017-12-15T00:00:00": "food bin and red box", "2017-12-18T00:00:00": "black box" }'

        const requestStub = (url, callback) => {
            callback(false, null, restAPICallResult)
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub, '../lib/AlexaDeviceAddressClient': alexaDeviceAddressClientStub });

        const findEventPromise = findEventAPI(alexa, 'nextBin', null, date);
        expect(findEventPromise).to.be.rejectedWith("I couldn't find the next bin collection, please try again later.").then(() => {
            done();
        });
    });

    it('should fail gracefully if there is an http error', done => {
        const requestStub = (url, callback) => {
            callback('http error', null)
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub, '../lib/AlexaDeviceAddressClient': alexaDeviceAddressClientStub });

        const findEventPromise = findEventAPI(alexa, 'nextBin');
        expect(findEventPromise).to.be.rejectedWith("I didn't understand that query, please try again.").then(() => {
            done();
        });
    });

    it('should find the next collection of type', done => {
        const date = new Date("2017-12-03T00:00:00")
        const restAPICallResult = '{ "2017-12-15T00:00:00": "food bin and red box", "2017-12-18T00:00:00": "black box" }'

        const requestStub = (url, callback) => {
            callback(false, null, restAPICallResult)
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub, '../lib/AlexaDeviceAddressClient': alexaDeviceAddressClientStub });

        const findEventPromise = findEventAPI(alexa, 'binType', 'food bin', date);
        expect(findEventPromise).to.be.fulfilled.then(data => {

            expect(data).to.equal('Next collection of the food bin is: food bin and red box on Friday<say-as interpret-as="date">????1215</say-as>');
            done();
        });
    });

    it('should find the next collection of type, black box', done => {
        const date = new Date("2017-12-03T00:00:00")
        const restAPICallResult = '{ "2017-12-15T00:00:00": "food bin and red box", "2017-12-18T00:00:00": "black box" }'

        const requestStub = (url, callback) => {
            callback(false, null, restAPICallResult)
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub, '../lib/AlexaDeviceAddressClient': alexaDeviceAddressClientStub });

        const findEventPromise = findEventAPI(alexa, 'binType', 'black box', date);
        expect(findEventPromise).to.be.fulfilled.then(data => {

            expect(data).to.equal('Next collection of the black box is: black box on Monday<say-as interpret-as="date">????1218</say-as>');
            done();
        });
    });

    it('should fail gracefully if it doesn\'t find the next bin', done => {
        const date = new Date("2017-12-18T00:00:00")
        const restAPICallResult = '{ "2017-12-15T00:00:00": "food bin and red box", "2017-12-18T00:00:00": "black box" }'

        const requestStub = (url, callback) => {
            callback(false, null, restAPICallResult)
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub, '../lib/AlexaDeviceAddressClient': alexaDeviceAddressClientStub });

        const findEventPromise = findEventAPI(alexa, 'binType', null, date);
        expect(findEventPromise).to.be.rejectedWith("I didn't understand that collection type, please try again.").then(() => {
            done();
        });
    });

    it('should fail gracefully if it doesn\'t find the next bin, with a binType', done => {
        const date = new Date("2017-12-18T00:00:00")
        const restAPICallResult = '{ "2017-12-15T00:00:00": "food bin and red box", "2017-12-18T00:00:00": "black box" }'

        const requestStub = (url, callback) => {
            callback(false, null, restAPICallResult)
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub, '../lib/AlexaDeviceAddressClient': alexaDeviceAddressClientStub });

        const findEventPromise = findEventAPI(alexa, 'binType', "some-other-bin", date);
        expect(findEventPromise).to.be.rejectedWith("I couldn't find the next some-other-bin collection, please try again later.").then(() => {
            done();
        });
    });

    it('should fail gracefully if there is an http error', done => {
        const requestStub = (url, callback) => {
            callback('http error', null)
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub, '../lib/AlexaDeviceAddressClient': alexaDeviceAddressClientStub });

        const findEventPromise = findEventAPI(alexa, 'binType');
        expect(findEventPromise).to.be.rejectedWith("I didn't understand that query, please try again.").then(() => {
            done();
        });
    });
});
