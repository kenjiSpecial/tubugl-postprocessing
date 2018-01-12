/**
 * screenshot page with puppeteer
 */

const argv = require('minimist')(process.argv.slice(2));
const dir = argv.dir;
const puppeteer = require('puppeteer');

async function timeout(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.setViewport({ width: 640, height: 360 });
	console.log(`http://localhost:8200/docs/${dir}/?NoDebug/`);
	await page.goto(`http://localhost:8200/docs/${dir}/?NoDebug/`, { waitUntil: 'networkidle0' });
	await timeout(1000);
	await page.screenshot({ path: `docs/${dir}/thumbnail.png` });

	browser.close();
})();
