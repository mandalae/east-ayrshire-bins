const expect = require('chai').expect;
const chai = require('chai');
const proxyquire = require('proxyquire');
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

describe('Find Event API', () => {

    let findEventAPI

    it('should find an event for tomorrow', done => {
        const date = new Date("2017-12-14T00:00:00")
        const restAPICallResult = '{ "2017-12-15T00:00:00": "food bin and red box", "2017-12-18T00:00:00": "black box" }'

        const requestStub = (url, callback) => {
            callback(false, null, restAPICallResult)
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub });

        const findEventPromise = findEventAPI('tomorrow', null, date);
        expect(findEventPromise).to.be.fulfilled.then(data => {
            expect(data).to.equal("Tomorrow's collection is food bin and red box");
            done();
        });
    });

    it('should return a graceful error if no events tomorrow', done => {
        const date = new Date("2017-12-03T00:00:00")
        const restAPICallResult = '{ "2017-12-15T00:00:00": "food bin and red box", "2017-12-18T00:00:00": "black box" }'
        const requestStub = (url, callback) => {
            callback(false, null, restAPICallResult)
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub });

        const findEventPromise = findEventAPI('tomorrow', null, date);
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

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub });

        const findEventPromise = findEventAPI('tomorrow', null, date);
        expect(findEventPromise).to.be.fulfilled.then(data => {
            expect(data).to.equal("Tomorrow's collection is food bin and red box");
            done();
        });
    });

    it('should throw an error if http request fails', done => {
        const requestStub = (url, callback) => {
            callback('http error')
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub });

        const findEventPromise = findEventAPI('tomorrow');
        expect(findEventPromise).to.be.rejectedWith("I didn't understand that query, please try again.").then(() => {
            done();
        });
    });

    it('should find the next event', done => {
        const date = new Date("2017-12-03T00:00:00")
        const restAPICallResult = '{ "2017-12-15T00:00:00": "food bin and red box", "2017-12-18T00:00:00": "black box" }'

        const requestStub = (url, callback) => {
            callback(false, null, restAPICallResult)
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub });

        const findEventPromise = findEventAPI('nextBin', null, date);
        expect(findEventPromise).to.be.fulfilled.then(data => {

            expect(data).to.equal('Next collection is: food bin and red box on Friday<say-as interpret-as="date">????1215</say-as>');
            done();
        });
    });

    it('should find the next event, even the second one', done => {
        const date = new Date("2017-12-15T00:00:00")
        const restAPICallResult = '{ "2017-12-15T00:00:00": "food bin and red box", "2017-12-18T00:00:00": "black box" }'

        const requestStub = (url, callback) => {
            callback(false, null, restAPICallResult)
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub });

        const findEventPromise = findEventAPI('nextBin', null, date);
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

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub });

        const findEventPromise = findEventAPI('nextBin', null, date);
        expect(findEventPromise).to.be.rejectedWith("I couldn't find the next bin collection, please try again later.").then(() => {
            done();
        });
    });

    it('should fail gracefully if there is an http error', done => {
        const requestStub = (url, callback) => {
            callback('http error', null)
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub });

        const findEventPromise = findEventAPI('nextBin');
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

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub });

        const findEventPromise = findEventAPI('binType', 'food bin', date);
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

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub });

        const findEventPromise = findEventAPI('binType', 'black box', date);
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

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub });

        const findEventPromise = findEventAPI('binType', null, date);
        expect(findEventPromise).to.be.rejectedWith("I couldn't find the next bin collection, please try again later.").then(() => {
            done();
        });
    });

    it('should fail gracefully if there is an http error', done => {
        const requestStub = (url, callback) => {
            callback('http error', null)
        }

        findEventAPI = proxyquire('../src/findEventAPI', { 'request': requestStub });

        const findEventPromise = findEventAPI('binType');
        expect(findEventPromise).to.be.rejectedWith("I didn't understand that query, please try again.").then(() => {
            done();
        });
    });
});
