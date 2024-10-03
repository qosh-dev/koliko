const { parentPort } = require('worker_threads');
// const axios = require('axios');
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
  // const url =
  //   'https://rs.ok-skins.com/sell/full/730/2G8f5A_usdt.json?Expires=1727951611&OSSAccessKeyId=LTAI5tDg2x1cneB9QAAst1ck&Signature=IZb1zNAO5FNM5ffsHHNQwLYCU8c%3D';
  // const { data } = await axios.get(url);
  try {
    const filePath = path.join(__dirname, 'generatedItems.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
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
        min_auto_delivery_price: Infinity,
        min_manual_price: Infinity,
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
    } else if (item.delivery === 2) {
      result[key].min_auto_delivery_price = Math.min(
        result[key].min_auto_delivery_price,
        item.price
      );
      result[key].auto_delivery_cnt += 1;
    }
  });

  for (let key in result) {
    if (result[key].min_auto_delivery_price === Infinity) {
      result[key].min_auto_delivery_price = 0;
    }
    if (result[key].min_manual_price === Infinity) {
      result[key].min_manual_price = 0;
    }
  }

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

  return finalResult;
}

async function bootstrap() {
  const externalData = await fetchExternalData();
  const processedData = await processDataInChunks(externalData);

  parentPort.postMessage(processedData);
  console.log('END');
}

bootstrap();
