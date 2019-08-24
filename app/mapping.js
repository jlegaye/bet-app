const puppeteer = require('puppeteer')
const util = require('util')
const Base64 = require('js-base64').Base64;
// const CREDS = require('./creds');
const winamaxCreds = require('./winamaxCredentials')
require('events').EventEmitter.defaultMaxListeners = 50;
// const fs = require('fs');

const launchOptions = {
  headless: true
}

const getMapping = async (browser) => {
  const page = await browser.newPage()
  await page.goto('https://www.xscores.com/soccer/standings/france', {
    timeout: 10000,
    waitUntil: 'networkidle0'
  })

  const result = await page.evaluate(() => {
    let teamsElt = document.querySelectorAll('#scoretable > div:nth-child(3) > div > div > div > div.table_cell.table_team > a')
    let teams = []
    for (let teamElt of teamsElt) {
      teams.push(teamElt.innerText.trim())
    }
    return teams
  }).catch(e => {
    console.error('Error during getBetsInPage: ', e)
    throw e
  })
  return result;


  await page.close();
  // console.log('betsInPage: ', betsInPage)
  return betsInPage;
}


async function getMappings() {
  console.log('calling mappings');
  const browser = await puppeteer.launch(launchOptions)
  let result = null
  await getMapping(browser)
    .then(res => result = res)
    .catch(e => {
      console.error('Error during getMapping: ', e)
      throw e
    });
  await browser.close()
  return result
}

getMappings().then((res) => {
  console.log(util.inspect(res, false, null, true))
  console.log(res.length)
});

module.exports = getMappings;
