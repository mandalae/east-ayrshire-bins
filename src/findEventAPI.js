const request = require('request');

const binTypes = {
    "red": "red box",
    "red bin": "red box",
    "red box": "red box",
    "plastic": "red box",
    "plastics": "red box",

    "green": "residual waste bin",
    "residual waste": "residual waste bin",
    "residual": "residual waste bin",

    "black": "black box",
    "black box": "black box",
    "glass": "black box",
    "metal": "black box",

    "blue bin": "blue bin",
    "blue": "blue bin",
    "paper": "blue bin",

    "garden waste": "brown bin",
    "brown bin": "brown bin",
    "brown": "brown bin",

    "food": "food bin",
    "food bin": "food bin"
};

const calculateWeekDay = date => {
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return weekDays[parseInt(date.getDay())-1];
}

module.exports = (action, binType, inputDate) => {
    return new Promise((resolve, reject) => {
        let date
        if (!inputDate){
            date = new Date();
        } else {
            date = inputDate;
        }
        date.setHours(0,0,0,0);

        const options = {
            url: 'https://www.east-ayrshire.gov.uk/api/Recycling/Postcode/ka31sf',
            headers: {
                'Content-Type': 'application/json'
            }
        };

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
                                    let dateString = calculateWeekDay(itemDate) + '<say-as interpret-as="date">????' + month + ('0' + itemDate.getDate()).slice(-2) + '</say-as>'
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
                                let dateString = calculateWeekDay(itemDate) + '<say-as interpret-as="date">????' + month + (itemDate.getDate()) + '</say-as>'
                                resolve('Next collection of the ' + binType + ' is: ' + item + ' on ' + dateString)
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
        }
    });
}
