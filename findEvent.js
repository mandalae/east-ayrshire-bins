const ical = require('ical');

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

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

module.exports = (tomorrow, nextBin, binType) => {
    return new Promise((resolve, reject) => {
        const date = new Date();

        ical.fromURL('http://www.east-ayrshire.gov.uk/recycling/127020124.ics', {}, function(err, data) {
            for (var item in data) {
                if (data.hasOwnProperty(item)) {
                    let event = data[item];

                    if (tomorrow) {
                        if (event.start > date && event.start < date.setTime( date.getTime() + 1 * 86400000 )){
                            console.log(event);
                            if (event.description){
                                resolve('Tomorrow is ' + event.description)
                            } else {
                                reject('No events found');
                            }
                        } else {
                            reject('No events found');
                        }
                    } else if (nextBin){
                        if (event.start > date){
                            console.log(event);
                            const month = parseInt(event.start.getMonth())+1;
                            let dateString = weekDays[parseInt(event.start.getDay())-1] + '<say-as interpret-as="date">????' + month + (parseInt(event.start.getDate())-1) + '</say-as>'
                            resolve('Next collection is: ' + event.description + ' on ' + dateString)
                            break;
                        } else {
                            reject('No events found');
                        }
                    } else if (binType){
                        // TODO: Pull out of this loop and make separate to enable looping over everything.
                        if (event.start > date && event.description.indexOf(binTypes[binType]) > -1){
                            console.log(event);
                            const month = parseInt(event.start.getMonth())+1;
                            let dateString = weekDays[parseInt(event.start.getDay())-1] + '<say-as interpret-as="date">????' + month + (parseInt(event.start.getDate())-1) + '</say-as>'
                            resolve('Next collection of the ' + binType + ' is: ' + event.description + ' on ' + dateString)
                            break;
                        }
                    }
                }
            }
            reject('No events found');
        });
    });
}
