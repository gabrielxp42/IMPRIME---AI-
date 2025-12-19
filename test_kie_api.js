const https = require('https');

const data = JSON.stringify({
    model: 'google/nano-banana',
    input: {
        prompt: 'cat',
        aspect_ratio: '1:1',
        output_format: 'png'
    }
});

const options = {
    hostname: 'api.kie.ai',
    path: '/api/v1/jobs/createTask',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer c3a158e9c64e1c97469753983a1069c7',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });
    res.on('end', () => {
        console.log('BODY: ' + body);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
