const request = require('request');
const AlexaDeviceAddressClient = require('../lib/AlexaDeviceAddressClient');

const binTypes = {
    "red": "red box",
    "red bin": "red box",
    "red box": "red box",
    "plastic": "red box",
    "plastics": "red box",

    "green": "residual waste bin",
    "green bin": "residual waste bin",
    "residual waste": "residual waste bin",
    "residual": "residual waste bin",

    "black": "black box",
    "black box": "black box",
    "glass": "black box",
    "glass bin": "black box",
    "metal": "black box",
    "metal bin": "black box",

    "blue bin": "blue bin",
    "blue": "blue bin",
    "paper": "blue bin",

    "garden": "brown bin",
    "garden waste": "brown bin",
    "brown bin": "brown bin",
    "brown": "brown bin",

    "food": "food bin",
    "food bin": "food bin"
};

const eastAyrshirePostcodes = [
    "DG7",
    "KA1",
    "KA16",
    "KA17",
    "KA18",
    "KA19",
    "KA2",
    "KA3",
    "KA4",
    "KA5",
    "KA6"
]

const ALL_ADDRESS_PERMISSION = "read::alexa:device:all:address";

const PERMISSIONS = [ALL_ADDRESS_PERMISSION];

const calculateWeekDay = date => {
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return weekDays[parseInt(date.getDay())-1];
}

module.exports = (self, action, binType, inputDate) => {
    return new Promise((resolve, reject) => {

        if (self.event.session.application.applicationId != 'amzn1.ask.skill.64dc032e-b923-433c-9acd-70937a3b0fbc'){
            reject('Your Alexa unit appears to have attempted to contact the wrong skill endpoint. Please contact support.');
            return;
        }

        const consentToken = self.event.context.System.user.permissions ? self.event.context.System.user.permissions.consentToken : false;

        if(!consentToken) {
            console.log("User did not give us permissions to access their address.");
            console.info("Ending getAddressHandler()");
            reject({
                tellWithPermissionCard: 'Please enable Location permissions for this skill in the Amazon Alexa app.',
                permissions: PERMISSIONS
            });
            return;
        }

        const deviceId = self.event.context.System.device.deviceId;
        const apiEndpoint = self.event.context.System.apiEndpoint;

        const alexaDeviceAddressClient = new AlexaDeviceAddressClient(apiEndpoint, deviceId, consentToken);
        let deviceAddressRequest = alexaDeviceAddressClient.getFullAddress();

        deviceAddressRequest.then(addressResponse => {
            console.log('Found address:', addressResponse.address);

            let date
            if (!inputDate){
                date = new Date();
            } else {
                date = inputDate;
            }
            date.setHours(0,0,0,0);

            const todaysDateString = date.getFullYear() + '-' + (parseInt(date.getMonth())+1) + '-' + date.getDate()
            const nextYearDateString = (parseInt(date.getFullYear()) + 1) + '-' + (parseInt(date.getMonth())+1) + '-' + date.getDate()

            const postCode = addressResponse.address.postalCode.replace(' ', '').toLowerCase();
            let validPostCode = false;
            for (i in eastAyrshirePostcodes){
                if (postCode.indexOf(eastAyrshirePostcodes[i].toLowerCase()) > -1){
                    validPostCode = true;
                }
            }
            if (!validPostCode){
                reject("Unfortunately your postcode doesn't appear to be a valid East Ayrshire postcode. If you believe this to be a mistake, please check and try again.");
                return;
            }
            let houseNumber = addressResponse.address.addressLine1.split(' ')[0];
            if (isNaN(houseNumber)){
                houseNumber = addressResponse.address.addressLine1.split(',')[0];
                if (addressResponse.address.addressLine1.indexOf(',') == -1 || houseNumber.length < 2){
                    reject("Unfortunately your address line 1 doesn't appear to have a house number or house name in it. This skill requires that to find the correct information");
                    return;
                }
            }

            const options = {
                url: 'https://www.east-ayrshire.gov.uk/api/Recycling/Postcode/' + postCode + '/' + houseNumber + '/' + todaysDateString + '/' + nextYearDateString,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            console.log('Requesting url:', options.url);

            switch(action){
                case 'tomorrow':
                    request(options, (error, response, body) => {
                        if (!error){
                            const events = JSON.parse(body);
                            let found = false
                            Object.keys(events).map(function(key, index) {
                                const item = events[key];
                                const itemDate = new Date(key);
                                if (itemDate.getTime() == date.setTime( date.getTime() + 1 * 86400000 )) {
                                    resolve("Tomorrow's collection is " + item);
                                } else {
                                    resolve('There are no bins tomorrow');
                                }
                            });
                        } else {
                            console.log(error);
                            reject("I didn't understand that query, please try again.");
                        }
                    });
                    break;
                case 'nextBin':
                    request(options, (error, response, body) => {
                        if (!error){
                            const events = JSON.parse(body);
                            let found = false;
                            Object.keys(events).map(function(key, index) {
                                const item = events[key];
                                const itemDate = new Date(key);
                                if (itemDate > date){
                                    if (!found){
                                        found = true;
                                        const month = parseInt(itemDate.getMonth())+1;
                                        let dateString = calculateWeekDay(itemDate) + '<say-as interpret-as="date">????' + ('0' + month).slice(-2) + ('0' + itemDate.getDate()).slice(-2) + '</say-as>'
                                        resolve('Next collection is: ' + item + ' on ' + dateString);
                                    }
                                }
                            });
                            if (!found){
                                reject("I couldn't find the next bin collection, please try again later.")
                            }
                        } else {
                            console.log(error);
                            reject("I didn't understand that query, please try again.");
                        }
                    });
                    break;
                case 'binType':
                    request(options, (error, response, body) => {
                        if (!error){
                            const events = JSON.parse(body);
                            let found = false;
                            Object.keys(events).map(function(key, index) {
                                const item = events[key];
                                const itemDate = new Date(key);
                                if (itemDate > date && item.indexOf(binTypes[binType]) > -1){
                                    const month = parseInt(itemDate.getMonth())+1;
                                    let dateString = calculateWeekDay(itemDate) + '<say-as interpret-as="date">????' + ('0' + month).slice(-2) + ('0' + itemDate.getDate()).slice(-2) + '</say-as>'
                                    resolve('Next collection of the ' + binType + ' is: ' + item + ' on ' + dateString)
                                }
                            });
                            if (!found && !binType){
                                reject("I didn't understand that collection type, please try again.")
                            } else {
                                reject("I couldn't find the next " + binType + " collection, please try again later.")
                            }
                        } else {
                            console.log(error);
                            reject("I didn't understand that query, please try again.");
                        }
                    });
                    break;
            }
        });


    });
}
