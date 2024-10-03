const { parentPort } = require('worker_threads');
const axios = require('axios');
const path = require('path');
const { readFileSync } = require('fs');

// ---------------------------------------------------------------------------------------------

function sliceArray(data, chunkSize) {
  const slices = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    slices.push(data.slice(i, i + chunkSize));
  }
  return slices;
}

// ---------------------------------------------------------------------------------------------

async function fetchExternalData() {
  try {
    // const filePath = path.join(__dirname, 'generatedItems.json');
    // const fileContent = readFileSync(filePath, 'utf-8');
    // await new Promise((res,rej) => setTimeout(res, 3000))
    // return JSON.parse(fileContent);
    const url =
      'https://rs.ok-skins.com/sell/full/730/2G8f5A_usdt.json?Expires=1727957290&OSSAccessKeyId=LTAI5tDg2x1cneB9QAAst1ck&Signature=C1ueKmYikys%2FLaBBB8vnJrXQGH0%3D';
    const { data } = await axios.get(url);
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
        manual_delivery_cnt: 0,
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
