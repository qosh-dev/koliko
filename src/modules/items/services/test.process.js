const { parentPort } = require('worker_threads');
const axios = require('axios');
const path = require('path');
const { readFileSync, createReadStream } = require('fs');
const { createInterface } = require('readline');

// ---------------------------------------------------------------------------------------------

function sliceArray(data, chunkSize) {
  const slices = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    slices.push(data.slice(i, i + chunkSize));
  }
  return slices;
}

async function readFileWithFakes() {
  try {
    const filePath = path.join(__dirname, 'generatedItems.json');
    const fileStream = createReadStream(filePath, { encoding: 'utf-8' });

    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let jsonData = '';

    for await (const line of rl) {
      jsonData += line;
    }
    return JSON.parse(jsonData);
  } catch (error) {
    console.log({ error });
    return null;
  }
}

async function fetchFromExternalService() {
  return new Promise(async (resolve, reject) => {
    const response = await axios({
      method: 'get',
      // url: 'https://rs.ok-skins.com/sell/full/730/2G8f5A_usdt.json?Expires=1727957290&OSSAccessKeyId=LTAI5tDg2x1cneB9QAAst1ck&Signature=C1ueKmYikys%2FLaBBB8vnJrXQGH0%3D',
      url: 'http://localhost:2233/api/items/fakes',
      responseType: 'stream'
    });

    let data = '';
    const stream = response.data;
    let rawData = '';

    stream.on('data', (chunk) => {
      rawData += chunk.toString();
      data += chunk;
    });

    stream.on('end', () => {
      resolve(JSON.parse(data));
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}

// ---------------------------------------------------------------------------------------------

async function fetchExternalData() {
  try {
    let data = [];

    // data = await readFileWithFakes();
    data = await fetchFromExternalService();
    return data;
  } catch (error) {
    throw new Error('Error fetching external data: ' + error.message);
  }
}

function processSlice(slice) {
  const result = {};

  slice.forEach((item) => {
    const key = item.steamMarketHashName;

    if (!result[key]) {
      result[key] = {
        min_auto_delivery_price: 0,
        min_manual_price: 0,
        auto_delivery_cnt: 0,
        manual_delivery_cnt: 0
      };
    }

    if (item.delivery === 1) {
      result[key].min_manual_price = Math.min(
        result[key].min_manual_price,
        item.price
      );
      result[key].manual_delivery_cnt += 1;
    }

    if (item.delivery === 2) {
      result[key].min_auto_delivery_price = Math.min(
        result[key].min_auto_delivery_price,
        item.price
      );
      result[key].auto_delivery_cnt += 1;
    }
  });

  return result;
}

async function processDataInChunks(data) {
  const chunkSize = 100000;
  const slices = sliceArray(data, chunkSize);
  const finalResult = {};

  for (let slice of slices) {
    const result = processSlice(slice);

    for (let key in result) {
      if (!finalResult[key]) {
        finalResult[key] = result[key];
      } else {
        finalResult[key].min_auto_delivery_price = Math.min(
          finalResult[key].min_auto_delivery_price,
          result[key].min_auto_delivery_price
        );
        finalResult[key].min_manual_price = Math.min(
          finalResult[key].min_manual_price,
          result[key].min_manual_price
        );
        finalResult[key].auto_delivery_cnt += result[key].auto_delivery_cnt;
        finalResult[key].manual_delivery_cnt += result[key].manual_delivery_cnt;
      }
    }
  }

  Object.keys(finalResult).forEach((key) => {
    if (finalResult[key].min_auto_delivery_price === Infinity) {
      finalResult[key].min_auto_delivery_price = 0;
    }
    if (finalResult[key].min_manual_price === Infinity) {
      finalResult[key].min_manual_price = 0;
    }
  });

  return finalResult;
}

async function bootstrap() {
  const externalData = await fetchExternalData();
  const processedData = await processDataInChunks(externalData);

  parentPort.postMessage(processedData);
  console.log('END');
}

bootstrap();
