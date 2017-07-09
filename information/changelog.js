var exec = require('child_process').exec;
var fs = require('fs');

var pathToLog = 'information/log';
var pathToReadMe = 'information/CHANGELOG.md';
var version = process.env.NODE_ENV;

var fth = '';
var fix = '';
var chn = '';
var other = '';

var readMeData = '';
exec('git log --pretty=oneline --format=%B ' + version + ' >'+pathToLog, function (err, stdout, stderr) {
    var lineReader = require('readline').createInterface({
        input: require('fs').createReadStream(pathToLog)
    });

    lineReader.on('close', function () {
        version = version.substring(version.indexOf("0") + 0);
        readMeData = '# '+ version + '\n \n';
        if (chn.length > 0) {
            readMeData = readMeData + '## Changes \n \n' + chn + ' \n';
        }
        if (fth.length > 0) {
            readMeData = readMeData + '## New features \n \n' + fth + ' \n';
        }
        if (fix.length > 0) {
            readMeData = readMeData + '## Bug fixes \n \n' + fix + ' \n';
        }
        if (other.length > 0){
            readMeData = readMeData + '## Other \n \n' + other + ' \n';
        }
        var file = pathToReadMe;
        var data = fs.readFileSync(file); //read existing contents into data
        var fd = fs.openSync(file, 'w+');
        var buffer = new Buffer(readMeData);

        fs.writeSync(fd, buffer, 0, buffer.length, 0); //write new data
        fs.appendFile(fd, data, function (err) {
            if (err) console.log(err);
        });
        fs.close(fd, function (err) {
            if (err) console.log(err);
        });

        fs.unlink(pathToLog, function (err) {
            if (err) console.log(err);
        });
    });

    lineReader.on('line', function (line) {
        var place = line[0] + line[1] + line[2];
        var data = '';

        if (place === 'new' || place === 'New') {
            data = line.substring(line.indexOf(":") + 1);
            fth = fth + '* **new:** ' + data + '\n';
        }else if (place === 'fix' || place === 'Fix') {
            data = line.substring(line.indexOf(":") + 1);
            fix = fix + '* **fix:** ' + data + '\n';
        }else if (place === 'chg' || place === 'Chg') {
            data = line.substring(line.indexOf(":") + 1);
            chn = chn + '* **chg:** ' + data + '\n';
        } else if(place.length > 0){
            other = other + '* ' + line + '\n';
        }

    });
});
