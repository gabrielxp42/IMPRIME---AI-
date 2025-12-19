const https = require('https');
const fs = require('fs');

// Ler uma imagem de teste e converter para base64
let imageBase64 = '';
try {
    const testImagePath = './test_dummy.png';
    if (fs.existsSync(testImagePath)) {
        const buffer = fs.readFileSync(testImagePath);
        imageBase64 = buffer.toString('base64');
        console.log('Image loaded, base64 length:', imageBase64.length);
    } else {
        console.log('No test image found');
        process.exit(1);
    }
} catch (e) {
    console.log('Error loading image:', e.message);
    process.exit(1);
}

const dataUri = `data:image/png;base64,${imageBase64}`;

// Diferentes formatos de teste
const tests = [
    {
        name: 'inputImage field',
        body: {
            model: 'google/nano-banana',
            input: {
                prompt: 'transform into cartoon style',
                aspect_ratio: '1:1',
                output_format: 'png',
                inputImage: dataUri
            }
        }
    },
    {
        name: 'image_urls array',
        body: {
            model: 'google/nano-banana',
            input: {
                prompt: 'transform into cartoon style',
                aspect_ratio: '1:1',
                output_format: 'png',
                image_urls: [dataUri]
            }
        }
    },
    {
        name: 'image field',
        body: {
            model: 'google/nano-banana',
            input: {
                prompt: 'transform into cartoon style',
                aspect_ratio: '1:1',
                output_format: 'png',
                image: dataUri
            }
        }
    },
    {
        name: 'img_url field',
        body: {
            model: 'google/nano-banana',
            input: {
                prompt: 'transform into cartoon style',
                aspect_ratio: '1:1',
                output_format: 'png',
                img_url: dataUri
            }
        }
    },
    {
        name: 'base64Data field',
        body: {
            model: 'google/nano-banana',
            input: {
                prompt: 'transform into cartoon style',
                aspect_ratio: '1:1',
                output_format: 'png',
                base64Data: dataUri
            }
        }
    },
    {
        name: 'reference_images field',
        body: {
            model: 'google/nano-banana',
            input: {
                prompt: 'transform into cartoon style',
                aspect_ratio: '1:1',
                output_format: 'png',
                reference_images: [dataUri]
            }
        }
    }
];

let currentTest = 0;

function runTest() {
    if (currentTest >= tests.length) {
        console.log('\n=== All tests completed ===');
        return;
    }

    const test = tests[currentTest];
    const data = JSON.stringify(test.body);

    console.log(`\n=== TEST ${currentTest + 1}: ${test.name} ===`);

    const options = {
        hostname: 'api.kie.ai',
        path: '/api/v1/jobs/createTask',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer c3a158e9c64e1c97469753983a1069c7',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
            const parsed = JSON.parse(body);
            if (parsed.code === 200) {
                console.log('✅ SUCCESS! TaskId:', parsed.data);
            } else {
                console.log('❌ FAILED:', parsed.msg);
            }
            currentTest++;
            setTimeout(runTest, 500);
        });
    });

    req.on('error', (e) => {
        console.error(`Error: ${e.message}`);
        currentTest++;
        setTimeout(runTest, 500);
    });

    req.write(data);
    req.end();
}

runTest();
