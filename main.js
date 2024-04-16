const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const readline = require('readline');

async function runPuppeteer() {
    puppeteerExtra.use(StealthPlugin());

    const browser = await puppeteerExtra.launch({
        headless: "new",
        defaultViewport: null,
        //args: ['--start-maximized'],
    });

    const page = await browser.newPage();

    await page.goto('https://www.unipin.com/login');
    console.log('[!] Waiting login');

    await page.waitForSelector('#sign-in-email');
    await page.type('#sign-in-email', 'cuantiktokori.002@gmail.com');

    await page.waitForSelector('#signInPassword');
    await page.type('#signInPassword', 'Faqih300720');

    await page.click('#signin-email-submit-button');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    console.log('[!] Login Successful\n');

    await page.goto('https://www.unipin.com/reload/upgiftcard');
    await page.waitForTimeout(5000);

    // Read data from kode.txt and process each line
    try {
        const data = await fs.readFile('kode.txt', 'utf-8');
        const lines = data.split('\n');

        for (const line of lines.slice(0, -1)) {
            // Extract only the numeric part of the line
            console.log(`[!] Redeem code: ${line}`)

            // Input cleaned data into the HTML element
            // await page.type('#serial_1', line);
            // Input each part into the respective HTML elements
            await page.waitForTimeout(1000);
            //const cleanedLine = parts[1].replace(/[^0-9]/g, '');
            const parts = line.split('-');
            await page.type('#serial_1', parts[0]);
            await page.waitForTimeout(1000);
            await page.type('#serial_2', parts[2]);

            await page.waitForTimeout(1000);
            for (let i = 1; i <= 4; i++) {
                await page.waitForTimeout(1000);
                await page.keyboard.type(parts[i + 2]);
            }
            await page.waitForTimeout(5000);

            // Click the "Konfirmasi" button
            // await page.click('#unipincoderedemption-submit');
 
            // Check if the "Invalid Serial or PIN" message is present
            const errorMessage = await page.evaluate(() => {
                const alertElement = document.querySelector('.alert-danger');
                return alertElement ? alertElement.innerText.trim() : null;
            });

            const successBadge = await page.$('img.payment-success-badge');

            if (errorMessage === 'Invalid Serial or PIN') {
                console.log('[!] Redeem Failed Wrong Code')
                await fs.appendFile('gagal.txt', `${line}\n`);

            } else if (errorMessage && errorMessage.includes('4')) {
                console.log('[!] Retry Redeem (Minus Digit)');
                await fs.appendFile('ulang-digit.txt', `${line}\n`);

            } else if (errorMessage && errorMessage.includes('Consumed')) {
                console.log('[!] Code Used');
                await fs.appendFile('kode-used.txt', `${line}\n`);

            } else if (successBadge) {
                console.log('[!] Redeem Successful')
                await fs.appendFile('berhasil.txt', `${line}\n`);

            } else {
                console.log('[!] Retry Redeem (Eror)');
                await fs.appendFile('ulang-eror.txt', `${line}\n`);
            }

            const dataBaca = await fs.readFile('kode.txt', 'utf-8');
            const updatedData = dataBaca.replace(`${line}\n`, '');
            await fs.writeFile('kode.txt', updatedData);

            await page.waitForTimeout(2000);

            await page.goto('https://www.unipin.com/reload/upgiftcard');
            console.error('\n[!] Prepare redeem next code');
            await page.waitForTimeout(5000);
        }

        //await fs.writeFile('kode.txt', '');
    } catch (error) {
        console.error('[!] Error reading or processing kode.txt:', error);
    }

    console.error('[!] All code has Redeemed, Closing browser');
    await browser.close();
}


runPuppeteer();
