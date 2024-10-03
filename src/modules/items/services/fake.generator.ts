import { writeFileSync } from 'fs';
import path from 'path';

interface Item {
  id: number;
  price: number;
  steamId: number;
  assetId: number;
  classId: number;
  instanceId: number;
  delivery: number;
  steamMarketHashName: string;
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPrice(): number {
  return parseFloat(getRandomNumber(100, 0.01).toFixed(2));
}

function getRandomSteamMarketHashName(): string {
  const items = [
    'Souvenir',
    'AWP',
    'AK-47',
    'M4A4',
    'Glock-18',
    'Desert Eagle'
  ];
  return items[Math.floor(Math.random() * items.length)];
}


function generateItem(): Item {
  return {
    id: getRandomNumber(1e18, 1e19),
    price: getRandomPrice(),
    steamId: getRandomNumber(1e17, 1e18),
    assetId: getRandomNumber(1e10, 1e11),
    classId: getRandomNumber(1e9, 1e10),
    instanceId: getRandomNumber(1e8, 1e9),
    delivery: getRandomNumber(1, 2),
    steamMarketHashName: getRandomSteamMarketHashName()
  };
}

function generateItemsArray(count: number): Item[] {
  const items: Item[] = [];
  for (let i = 0; i < count; i++) {
    items.push(generateItem());
  }
  return items;
}

export const generateFakes = () => {
  console.log('generateFakes START');
  const itemsArray = generateItemsArray(2_000_000);
  const filePath = path.join(__dirname, 'generatedItems.json');
  writeFileSync(filePath, JSON.stringify(itemsArray, null, 2), 'utf-8');
  console.log('generateFakes END');
};
