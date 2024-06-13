import readline from 'readline';
import Web3 from 'web3';
import chalk from 'chalk';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let transactionCount = 0;
let sleeping = false;
let dailySleepTime, dailyWakeUpTime;

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function isValidTimeFormat(timeString) {
  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timePattern.test(timeString);
}

function isValidTimeRange(start, end) {
  const startTime = parseTime(start);
  const endTime = parseTime(end);
  return (startTime.hours < endTime.hours) || (startTime.hours === endTime.hours && startTime.minutes < endTime.minutes);
}

function parseTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
}

function formatTimeDifference(hours, minutes) {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function calculateTimeUntil(targetTime) {
  const currentTime = new Date();
  const target = new Date(currentTime);
  target.setHours(targetTime.hours, targetTime.minutes, 0, 0);

  if (currentTime > target) {
    target.setDate(target.getDate() + 1);
  }

  const diffMs = target - currentTime;
  const diffHrs = Math.floor((diffMs % 86400000) / 3600000);
  const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
  return formatTimeDifference(diffHrs, diffMins);
}

function getRandomTimeBetween(startTime, endTime) {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;
  const randomMinutes = Math.floor(Math.random() * (endMinutes - startMinutes + 1)) + startMinutes;

  const randomHours = Math.floor(randomMinutes / 60);
  const minutes = randomMinutes % 60;
  return { hours: randomHours, minutes };
}

function logErrorAndExit(message) {
  console.error(chalk.red(message));
  rl.close();
  process.exit(1);
}

function doTimeRangesOverlap(start1, end1, start2, end2) {
  const start1Minutes = start1.hours * 60 + start1.minutes;
  const end1Minutes = end1.hours * 60 + end1.minutes;
  const start2Minutes = start2.hours * 60 + start2.minutes;
  const end2Minutes = end2.hours * 60 + end2.minutes;

  return (start1Minutes < end2Minutes && end1Minutes > start2Minutes);
}

function isValidPrivateKey(privateKey) {
  const privateKeyPattern = /^[0-9a-fA-F]{64}$/;
  return privateKeyPattern.test(privateKey);
}

async function main() {
  const rpcURL = "http://localhost:16545";
  const web3 = new Web3(new Web3.providers.HttpProvider(rpcURL));

  try {
    await web3.eth.net.isListening();
    console.log(chalk.green('RPC sunucusuna başarıyla bağlandı'));
  } catch (e) {
    console.error(chalk.red('RPC sunucusuna bağlanılamadı:'), e);
    process.exit(1);
  }
  const rawPrivateKey = await askQuestion('MetaMask cüzdanının özel anahtarını girin: ');
  const privateKey = rawPrivateKey.trim();

  if (!isValidPrivateKey(privateKey)) {
    logErrorAndExit('Geçersiz özel anahtar formatı. Özel anahtar 64 karakter uzunluğunda bir hex string olmalıdır.');
  }

  let account;
  try {
    account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    console.log(chalk.green('Özel anahtar geçerli. İşleme devam ediliyor.'));
  } catch (error) {
    logErrorAndExit('Geçersiz özel anahtar. Lütfen doğru bir özel anahtar girin.');
  }

  const toAddresses = await askQuestion('Göndermek istediğiniz cüzdan adreslerini virgülle ayırarak girin (örnek: adres1,adres2,adres3): ');

  let amountRange, minAmount, maxAmount;
  const defaultAmountRange = '0.0001-0.0005';
  while (true) {
    const amountResponse = await askQuestion(`Göndermek istediğiniz minimum ve maksimum miktarları ${defaultAmountRange} olarak ayarlamak ister misiniz? (enter için evet): `);
    if (amountResponse === '') {
      [minAmount, maxAmount] = defaultAmountRange.split('-').map(Number);
      console.log(chalk.green(`Miktar aralığı ${defaultAmountRange} olarak ayarlandı.`));
      break;
    } else {
      [minAmount, maxAmount] = amountResponse.split('-').map(Number);
      if (!isNaN(minAmount) && !isNaN(maxAmount) && minAmount > 0 && maxAmount > 0 && minAmount < maxAmount) {
        console.log(chalk.green(`Miktar aralığı ${minAmount}-${maxAmount} olarak ayarlandı.`));
        break;
      } else {
        console.log(chalk.red('Geçersiz miktar aralığı. Lütfen geçerli bir aralık girin.'));
      }
    }
  }

  let intervalRange, minInterval, maxInterval;
  const defaultIntervalRange = '40-90';
  while (true) {
    const intervalResponse = await askQuestion(`İşlemi tekrar etmek istediğiniz minimum ve maksimum saniye aralığını ${defaultIntervalRange} olarak ayarlamak ister misiniz? (enter için evet): `);
    if (intervalResponse === '') {
      [minInterval, maxInterval] = defaultIntervalRange.split('-').map(Number);
      console.log(chalk.green(`İşlem tekrarı aralığı ${defaultIntervalRange} olarak ayarlandı.`));
      break;
    } else {
      [minInterval, maxInterval] = intervalResponse.split('-').map(Number);
      if (!isNaN(minInterval) && !isNaN(maxInterval) && minInterval > 0 && maxInterval > 0 && minInterval < maxInterval) {
        console.log(chalk.green(`İşlem tekrarı aralığı ${minInterval}-${maxInterval} olarak ayarlandı.`));
        break;
      } else {
        console.log(chalk.red('Geçersiz işlem aralığı. Lütfen geçerli bir aralık girin.'));
      }
    }
  }

  let useSleepWake;
  while (true) {
    useSleepWake = (await askQuestion('Uyuma ve uyanma özelliğini kullanmak ister misiniz? (y/n): ')).toLowerCase();
    if (useSleepWake === 'y' || useSleepWake === 'n') {
      break;
    } else {
      console.log(chalk.red('Geçersiz giriş. Lütfen "y" veya "n" girin.'));
    }
  }

  let sleepRange, wakeRange, sleepStart, sleepEnd, wakeStart, wakeEnd;
  const defaultSleepRange = '04:00-04:30';
  const defaultWakeRange = '09:00-09:30';

  if (useSleepWake === 'y') {
    while (true) {
      const sleepResponse = await askQuestion(`Uyuma aralığını ${defaultSleepRange} olarak ayarlamak ister misiniz? (enter için evet): `);
      if (sleepResponse === '') {
        [sleepStart, sleepEnd] = defaultSleepRange.split('-').map(time => time.trim());
        console.log(chalk.green(`Uyuma aralığı ${defaultSleepRange} olarak ayarlandı.`));
        break;
      } else {
        [sleepStart, sleepEnd] = sleepResponse.split('-').map(time => time.trim());
        if (isValidTimeFormat(sleepStart) && isValidTimeFormat(sleepEnd) && isValidTimeRange(sleepStart, sleepEnd)) {
          console.log(chalk.green(`Uyuma aralığı ${sleepStart}-${sleepEnd} olarak ayarlandı.`));
          break;
        } else {
          console.log(chalk.red('Geçersiz uyuma aralığı. Lütfen geçerli bir aralık girin.'));
        }
      }
    }

    while (true) {
      const wakeResponse = await askQuestion(`Uyanma aralığını ${defaultWakeRange} olarak ayarlamak ister misiniz? (enter için evet): `);
      if (wakeResponse === '') {
        [wakeStart, wakeEnd] = defaultWakeRange.split('-').map(time => time.trim());
        console.log(chalk.green(`Uyanma aralığı ${defaultWakeRange} olarak ayarlandı.`));
        break;
      } else {
        [wakeStart, wakeEnd] = wakeResponse.split('-').map(time => time.trim());
        if (isValidTimeFormat(wakeStart) && isValidTimeFormat(wakeEnd) && isValidTimeRange(wakeStart, wakeEnd)) {
          console.log(chalk.green(`Uyanma aralığı ${wakeStart}-${wakeEnd} olarak ayarlandı.`));
          break;
        } else {
          console.log(chalk.red('Geçersiz uyanma aralığı. Lütfen geçerli bir aralık girin.'));
        }
      }
    }

    const sleepStartTime = parseTime(sleepStart);
    const sleepEndTime = parseTime(sleepEnd);
    const wakeStartTime = parseTime(wakeStart);
    const wakeEndTime = parseTime(wakeEnd);

    if (doTimeRangesOverlap(sleepStartTime, sleepEndTime, wakeStartTime, wakeEndTime)) {
      logErrorAndExit('Uyuma ve uyanma aralıkları çakışıyor veya mantıksız. Lütfen farklı aralıklar girin.');
    }

    function setDailySleepWakeTimes() {
      let valid = false;
      while (!valid) {
        dailySleepTime = getRandomTimeBetween(sleepStart, sleepEnd);
        dailyWakeUpTime = getRandomTimeBetween(wakeStart, wakeEnd);

        const sleepMinutes = dailySleepTime.hours * 60 + dailySleepTime.minutes;
        const wakeMinutes = dailyWakeUpTime.hours * 60 + dailyWakeUpTime.minutes;
        const difference = Math.abs(wakeMinutes - sleepMinutes);

        if (difference >= 5) {
          valid = true;
        }
      }
      console.log(chalk.blue(`Uyuma zamanı: ${formatTimeDifference(dailySleepTime.hours, dailySleepTime.minutes)}, Uyanma zamanı: ${formatTimeDifference(dailyWakeUpTime.hours, dailyWakeUpTime.minutes)} olarak belirlendi.`));
    }

    setDailySleepWakeTimes();
  }

  function sendTransaction() {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    if (useSleepWake === 'y') {
      const sleepTime = parseTime(formatTimeDifference(dailySleepTime.hours, dailySleepTime.minutes));
      const wakeUpTime = parseTime(formatTimeDifference(dailyWakeUpTime.hours, dailyWakeUpTime.minutes));

      if (currentHour === 0 && currentMinute === 0) {
        setDailySleepWakeTimes();
      }

      if (currentHour === sleepTime.hours && currentMinute >= sleepTime.minutes && currentMinute < parseTime(sleepEnd).minutes) {
        if (!sleeping) {
          console.log(chalk.yellow('Şimdi uyuma zamanı. İşlemler duraklatıldı.'));
          sleeping = true;
          const sleepDuration = (parseTime(sleepEnd).hours * 60 + parseTime(sleepEnd).minutes) * 60 * 1000 - (currentHour * 60 + currentMinute) * 60 * 1000;
          const intervalId = setInterval(() => {
            console.log(chalk.yellow(`Uyku zamanı devam ediyor. Uyanmaya kalan süre: ${calculateTimeUntil(wakeUpTime)}`));
          }, 10 * 60 * 1000);
          setTimeout(() => {
            clearInterval(intervalId);
            console.log(chalk.green(`Uyanma zamanı. Saat ${formatTimeDifference(dailyWakeUpTime.hours, dailyWakeUpTime.minutes)}`));
            sleeping = false;
            sendTransaction();
          }, sleepDuration);
        } else {
          setTimeout(sendTransaction, 60 * 1000);
        }
        return;
      }

      if (currentHour === wakeUpTime.hours && currentMinute >= wakeUpTime.minutes && currentMinute < parseTime(wakeEnd).minutes && sleeping) {
        console.log(chalk.green('Şimdi uyanma zamanı. İşlemler devam ediyor.'));
        sleeping = false;
      }
    }

    const addresses = toAddresses.split(',').map(addr => addr.trim());

    const minAmt = parseFloat(minAmount);
    const maxAmt = parseFloat(maxAmount);

    const amount = generateRandomAmount(minAmt, maxAmt);
    const nextInterval = generateComplexRandomInterval(parseFloat(minInterval), parseFloat(maxInterval));

    const amountStr = amount.toFixed(6);
    const nextIntervalStr = nextInterval.toFixed(2);

    const tx = {
      from: web3.eth.defaultAccount,
      to: addresses[Math.floor(Math.random() * addresses.length)],
      value: web3.utils.toWei(amountStr.toString(), 'ether'),
      gas: 21000,
      gasPrice: web3.utils.toWei('1', 'gwei')
    };

    web3.eth.sendTransaction(tx)
      .then(receipt => {
        transactionCount++;

        let logMessage = `Toplam işlem sayısı: ${chalk.magenta(transactionCount)} -/- Gönderim adresi: ${chalk.green(tx.to)}`;
        if (useSleepWake === 'y') {
          const sleepTime = parseTime(formatTimeDifference(dailySleepTime.hours, dailySleepTime.minutes));
          logMessage += ` -/- Uyuma zamanı: ${chalk.blue(formatTimeDifference(dailySleepTime.hours, dailySleepTime.minutes))}, Uyanma zamanı: ${chalk.blue(formatTimeDifference(dailyWakeUpTime.hours, dailyWakeUpTime.minutes))}`;
          logMessage += ` -/- Uykuya kalan süre: ${chalk.hex('#ff7f00').bold(calculateTimeUntil(sleepTime))}`;
        }
        console.log(logMessage);
        console.log(`İşlem Hash: ${chalk.blue.bold(receipt.transactionHash)} -/- Sonraki işlem: ${chalk.yellow.bold(nextIntervalStr)} saniye -/- Miktar: ${chalk.red.bold(amountStr)} tEVMOS`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      })
      .catch(err => {
        console.error(chalk.red('İşlem gönderilirken hata oluştu:'), err);
      });

    setTimeout(sendTransaction, nextInterval * 1000);
  }

  function generateComplexRandomInterval(min, max) {
    const randomFactor1 = Math.random() * (max - min) + min;
    const randomFactor2 = Math.random() * (max - min) + min;
    const randomFactor3 = Math.random() * (max - min) + min;
    const variation = Math.sin(randomFactor1) + Math.cos(randomFactor2 / 2) + Math.tan(randomFactor3 / 3);
    const interval = Math.abs(randomFactor1 + variation);
    return Math.max(min, Math.min(max, interval)); // Min ve max değerlerin dışına çıkmaması için sınırlıyoruz
  }

  function generateRandomAmount(min, max) {
    return Math.random() * (max - min) + min;
  }

  sendTransaction();
}

main().then(() => rl.close());

