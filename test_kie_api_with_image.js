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
        console.log('No test image found, testing generation only');
    }
} catch (e) {
    console.log('Error loading image:', e.message);
}

// Teste 1: Geração pura (sem imagem)
const testGeneration = () => {
    const data = JSON.stringify({
        model: 'google/nano-banana',
        input: {
            prompt: 'a cute cat illustration',
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
            'Content-Length': Buffer.byteLength(data)
        }
    };

    console.log('\n=== TEST 1: Pure Generation ===');
    const req = https.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
            console.log('RESPONSE:', body);
            // Teste 2 após sucesso
            if (imageBase64) {
                setTimeout(testWithImage, 1000);
            }
        });
    });
    req.on('error', (e) => console.error(`Error: ${e.message}`));
    req.write(data);
    req.end();
};

// Teste 2: Edição com imagem (diferentes formatos)
const testWithImage = () => {
    const dataUri = `data:image/png;base64,${imageBase64}`;

    // Teste com inputImage
    const data = JSON.stringify({
        model: 'google/nano-banana',
        input: {
            prompt: 'transform into cartoon style',
            aspect_ratio: '1:1',
            output_format: 'png',
            inputImage: dataUri
        }
    });

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

    console.log('\n=== TEST 2: With inputImage ===');
    const req = https.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
            console.log('RESPONSE:', body);
            setTimeout(testWithImageUrls, 1000);
        });
    });
    req.on('error', (e) => console.error(`Error: ${e.message}`));
    req.write(data);
    req.end();
};

// Teste 3: Com image_urls (array)
const testWithImageUrls = () => {
    const dataUri = `data:image/png;base64,${imageBase64}`;

    const data = JSON.stringify({
        model: 'google/nano-banana',
        input: {
            prompt: 'transform into cartoon style',
            aspect_ratio: '1:1',
            output_format: 'png',
            image_urls: [dataUri]
        }
    });

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

    console.log('\n=== TEST 3: With image_urls ===');
    const req = https.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
            console.log('RESPONSE:', body);
            setTimeout(testWithImg_url, 1000);
        });
    });
    req.on('error', (e) => console.error(`Error: ${e.message}`));
    req.write(data);
    req.end();
};

// Teste 4: Com img_url (singular)
const testWithImg_url = () => {
    const dataUri = `data:image/png;base64,${imageBase64}`;

    const data = JSON.stringify({
        model: 'google/nano-banana',
        input: {
            prompt: 'transform into cartoon style',
            aspect_ratio: '1:1',
            output_format: 'png',
            img_url: dataUri
        }
    });

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

    console.log('\n=== TEST 4: With img_url ===');
    const req = https.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
            console.log('RESPONSE:', body);
        });
    });
    req.on('error', (e) => console.error(`Error: ${e.message}`));
    req.write(data);
    req.end();
};

// Iniciar testes
testGeneration();
