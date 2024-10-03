let { parentPort } = require('worker_threads');
let axios = require('axios');
let path = require('path');
let { createReadStream, writeFileSync } = require('fs');

function objectArrayFromStream(stream, callback) {
  return new Promise((res, rej) => {
    let tempStr = '';
    stream.on('data', (chunk) => {
      let str = chunk.toString().replace('\n', '').trim();

      tempStr += str.startsWith('[') ? str.slice(1, -1) : str;
      tempStr = tempStr.startsWith(',') ? tempStr.slice(1) : tempStr;

      let lastIndexOfClose = tempStr.lastIndexOf('}');

      if (lastIndexOfClose !== -1) {
        let readyChunk = tempStr.slice(0, lastIndexOfClose + 1);
        tempStr = tempStr.slice(lastIndexOfClose + 1);
        try {
          const parsedItems = JSON.parse(`[${readyChunk}]`);
          callback(parsedItems);
        } catch (err) {
          rej(err);
        }
      }
    });

    stream.on('error', rej);
    stream.on('end', res);
  });
}

// ---------------------------------------------------------------------------------------------

async function readFileWithFakes() {
  try {
    let filePath = path.join(__dirname, 'generatedItems.json');
    return createReadStream(filePath, { encoding: 'utf-8' });
  } catch (error) {
    throw new Error(error);
  }
}

async function fetchFromExternalServiceByChunks() {
  try {
    const response = await axios({
      method: 'get',
      url: 'http://localhost:2233/api/items/fakes',
      responseType: 'stream'
    });
    return response.data;
  } catch (err) {
    throw new Error(err);
  }
}

// ---------------------------------------------------------------------------------------------

function processSlice(slice) {
  return slice.reduce((result, item) => {
    let key = item.steamMarketHashName;

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
    return result;
  }, {});
}

async function processDataInChunks(stream) {
  let finalResult = {};

  await objectArrayFromStream(stream, (slice) => {
    let result = processSlice(slice);

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
  });

  return finalResult;
}

async function bootstrap() {
  const stream = await fetchFromExternalServiceByChunks();
  // const stream = await readFileWithFakes();

  let processedData = await processDataInChunks(stream);
  parentPort.postMessage(processedData);
}

bootstrap();
