module.exports = (options, resolve, reject) => {
    return request(options, (error, response, body) => {
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
}
