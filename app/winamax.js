const puppeteer = require('puppeteer')
const util = require('util')
const Base64 = require('js-base64').Base64;
// const CREDS = require('./creds');
const winamaxCreds = require('./winamaxCredentials')
require('events').EventEmitter.defaultMaxListeners = 50;
// const fs = require('fs');

const launchOptions = {
  headless: true,
  args: ['--no-sandbox']
}

const getWinamaxBets = async (browser) => {
  const page = await browser.newPage()
  await page.goto('https://www.winamax.fr/account/login.php?redir=/paris-sportifs/history', {
    timeout: 10000,
    waitUntil: 'networkidle0'
  })

  await page.waitFor('#loginbox_email')
  await page.click('#loginbox_email')
  const decryptedLogin = winamaxCreds.cryptr.decrypt(winamaxCreds.encryptedLogin);
  await page.keyboard.type(decryptedLogin)

  await page.click('#loginbox_password')
  const decryptedPassword = winamaxCreds.cryptr.decrypt(winamaxCreds.encryptedPassword);
  await page.keyboard.type(decryptedPassword)

  await page.click('#loginbox_birthday')
  const decryptedDay = winamaxCreds.cryptr.decrypt(winamaxCreds.encryptedDay);
  await page.keyboard.type(decryptedDay)
  await page.click('#loginbox_birthmonth')
  const decryptedMonth = winamaxCreds.cryptr.decrypt(winamaxCreds.encryptedMonth);
  await page.keyboard.type(decryptedMonth)
  await page.click('#loginbox_birthyear')
  const decryptedYear = winamaxCreds.cryptr.decrypt(winamaxCreds.encryptedYear);
  await page.keyboard.type(decryptedYear)

  // console.log('decryptedLogin: ' + decryptedLogin)
  // console.log('decryptedPassword: ' + decryptedPassword)
  // console.log('decryptedDay: ' + decryptedDay)
  // console.log('decryptedMonth: ' + decryptedMonth)
  // console.log('decryptedYear: ' + decryptedYear)
  await page.click('#login-button')
  // let buttonBarClass = '.sc-hCaUpS.eicyCN'
  let buttonBarClass = 'div > div:nth-child(1) > span > div > div.sc-jMMfwr.middle-column.dPhkCd > div > div > div:nth-child(1) > div > button:nth-child(3)'
  await page.waitFor(2000)
  await page.waitFor(buttonBarClass).catch(
    (err) => {
      // console.log(err)
      page.reload().catch(
        (error) => {
          console.log('Cannot load winamax bet page')
        })
      page.waitFor(buttonBarClass).catch(
        (error) => {
          console.log('Cannot load winamax bet page')
        })
    }
  )
  let pageNumber = 1
  let betsInPage = []

  // let buttonBarClass = '.sc-jGxEUC .sc-jUpvKA:nth-child(1) .sc-cHSUfg'
  let nbOfPages = 5
  while (pageNumber !== nbOfPages) {
    if (pageNumber !== 1) {
      // await page.click(buttonBarClass + ' *:nth-child(3)');
      await page.click(buttonBarClass);
      await page.waitFor(500)
    }
    betsInPage = betsInPage.concat(await getBetsInPage(page))
    await page.waitFor(300)
    console.log('page: ' + pageNumber)
    pageNumber++

  }

  await page.close();
  // console.log('betsInPage: ', betsInPage)
  return betsInPage;
}

const getIsLastPage = async (page) => {
  let isLastPage = await page.evaluate(() => {
    let elements = Array.from(document.querySelectorAll(buttonBarClass + ' button'));
    return elements[1].hasAttribute('disabled')
  });
  return isLastPage
}


const getBetsInPage = async (page) => {
  const result = await page.evaluate(() => {

    let pad2 = function (number) {

      return (number < 10 ? '0' : '') + number

    }
    let convertDateStrToIsoString = function (dateStr) {
      let dateStrSplit = dateStr.split(' ')
      let day = dateStrSplit[0]
      let monthStr = dateStrSplit[1]
      let month = convertMonthStrToNumber(monthStr)
      let year = dateStrSplit[2]
      let hour = dateStrSplit[3]
      let builtDate = year + '-' + month + '-' + pad2(day)
      let builtDateAndTime = builtDate + 'T' + hour

      let d = new Date(builtDateAndTime);
      // d.setTime(d.getTime() + (d.getTimezoneOffset() * 60) * 60 * 1000);
      let isoString = d.toISOString()
      return isoString
    }
    let convertMonthStrToNumber = function (monthStr) {
      if (monthStr.includes('janv')) {
        return '01'
      } else if (monthStr.includes('fév')) {
        return '02'
      } else if (monthStr.includes('mars')) {
        return '03'
      } else if (monthStr.includes('avril')) {
        return '04'
      } else if (monthStr.includes('mai')) {
        return '05'
      } else if (monthStr.includes('juin')) {
        return '06'
      } else if (monthStr.includes('juil')) {
        return '07'
      } else if (monthStr.includes('août')) {
        return '08'
      } else if (monthStr.includes('sept')) {
        return '09'
      } else if (monthStr.includes('oct')) {
        return '10'
      } else if (monthStr.includes('nov')) {
        return '11'
      } else if (monthStr.includes('déc')) {
        return '12'
      }
    }

    let getBetTechniqueFromBetDesc = function (betDesc) {
      let betTechnique = ""
      if (betDesc.includes('Mi-temps') && betDesc.includes('le plus de buts') && betDesc.includes('2de mi-temps')) {
        betTechnique = "secondHalfBetter"
      } else if (betDesc.includes('Mi-temps') && betDesc.includes('Nombre de buts') && betDesc.includes('Plus de 0,5 buts')) {
        betTechnique = "goalAtHalfTime"
      } else if (betDesc.includes('Nombre total de buts') && betDesc.includes('2-3 buts')) {
        betTechnique = "twoOrThreeGoals"
      } else if (betDesc.includes('Nombre de buts') && betDesc.includes('Plus de 1,5 buts')) {
        betTechnique = "moreThan1_5Goal"
      } else if (betDesc.includes('Nombre de buts') && betDesc.includes('Moins de')) {
        betTechnique = "under buts"
      } else if (betDesc.includes('Nombre de points') && betDesc.includes('Moins de')) {
        betTechnique = "under points"
      } else if (betDesc.includes('Nombre de points') && betDesc.includes('Plus de')) {
        betTechnique = "over points"
      } else if (betDesc.includes('2-3 buts')) {
        betTechnique = "2-3 buts"
      } else if (betDesc.includes('Match nul')) {
        betTechnique = "match nul"
      }
      return betTechnique
    }

    let getSportFromSvgPath = function (svgPath) {
      let sport = ''
      if (svgPath.startsWith('M0')) {
        sport = 'soccer'
      } else if (svgPath.startsWith('M10')) {
        sport = 'tennis'
      } else {
        sport = 'other'
      }
      return sport
    }


    // let betClass = '.sc-hAnkBK.bdylMN'
    let betClass = 'div > div:nth-child(1) > span > div > div.sc-jMMfwr.middle-column.dPhkCd > div > div > div:nth-child(2) > div'
    let elements = document.querySelectorAll(betClass);
    let lastBets = [];
    for (var element of elements) {
      let idStr = ''
      let type = ''
      // let typeAndIdClass = '.sc-bOCYYb.dGaSSa'
      let typeAndIdClass = 'div > div.sc-dvpmds.FamYe > div > div:nth-child(1)'
      if (element.querySelector(typeAndIdClass)) {
        idStr = element.querySelector(typeAndIdClass).innerText.trim();
      }

      let _id = idStr.substr(idStr.indexOf('/') + 1, idStr.length).trim()

      let typeClass = '.sc-eqPNPO'
      if (element.querySelector(typeClass)) {
        type = element.querySelector(typeClass).innerText.trim();
      }

      // let eventBlockClass = '.sc-dwztqd.bGlDAb'
      let eventBlockClass = 'div > div:nth-child(2) > div'
      let eventElmts = element.querySelectorAll(eventBlockClass);
      let events = [];

      for (var eventElmt of eventElmts) {

        let eventName = ''
        let eventTime = new Date().toISOString()
        let betDesc = ''
        let timeStr = ''

        // let eventNameClass = '.sc-hvvHee.fmdlja'
        let eventNameClass = 'div.sc-OxbzP.cbpAKW > span'
        if (eventElmt.querySelector(eventNameClass)) {
          eventName = eventElmt.querySelector(eventNameClass).innerText.trim()
        }
        let eventHome = ''
        let eventAway = ''
        if (eventName.includes(' - ')) {
          eventHome = eventName.substring(0, eventName.indexOf(' - '));
          eventAway = eventName.substr(eventName.indexOf(' - ') + 3);
        }
        if (eventElmt.querySelector('.time')) {
          timeStr = eventElmt.querySelector('.time').innerText.trim().replace('à ', '')
          eventTime = convertDateStrToIsoString(timeStr)
        }



        // let isMyMatchBet = eventElmt.querySelector('.sc-eSePXt.dYIoEV') !== null
        let myMatchSvgSelector = 'div > div.sc-cPuPxo.eJSuSC > svg'
        let isMyMatchBet = eventElmt.querySelector(myMatchSvgSelector) !== null
        if (isMyMatchBet) {
          // MYMATCH


          let eventResult = ''
          let eventResultClass = '.sc-iIHjhz'
          if (eventElmt.querySelector(eventResultClass)) {
            eventResult = eventElmt.querySelector(eventResultClass).innerText
          }
          let betOdds = ''
          let betOddsClass = '.sc-cPuPxo.eJSuSC b'
          if (eventElmt.querySelector(betOddsClass)) {
            let betOddsStr = eventElmt.querySelector(betOddsClass).innerText
            betOddsStr = betOddsStr.replace(',', '.')
            betOdds = parseFloat(betOddsStr)
          }
          let svgPath = element.querySelector('div > div.sc-bYnzgO.eobKac > span > svg > path').getAttribute('d')
          let sport = getSportFromSvgPath(svgPath)
          let descBlockClass = 'div div .sc-cPuPxo.eJSuSC'
          const descBlockQuery = eventElmt.querySelectorAll('div > div > div:nth-child(4) > div > div.sc-cPuPxo.eJSuSC > span')
          if (descBlockQuery) {

            let descElmts = descBlockQuery
            for (var descElmt of descElmts) {
              if (descElmt) {
                betDesc = descElmt.innerText.trim()
                betTechnique = getBetTechniqueFromBetDesc(betDesc)
              }
              events.push({
                sport,
                eventName,
                eventResult,
                eventTime,
                eventHome,
                eventAway,
                betDesc,
                betTechnique,
                betOdds

              })
            }
          }
        } else {
          // NOT MYMATCH
          const betDescQuery = eventElmt.querySelector('div > div.sc-lnrBVv.dpQHjv > span:nth-child(1)')
          if (betDescQuery) {
            betDesc = betDescQuery.innerText.trim();
          }
          betTechnique = getBetTechniqueFromBetDesc(betDesc)

          let betOdds = ''
          const betOddsQuery = eventElmt.querySelector('div > div.sc-lnrBVv.dpQHjv > span:nth-child(2) > b')
          if (betOddsQuery) {
            let betOddsStr = betOddsQuery.innerText.trim();
            betOddsStr = betOddsStr.replace(',', '.')
            betOdds = parseFloat(betOddsStr)
          }
          let eventResult = ''
          const eventResultQuery = eventElmt.querySelector('div > div.sc-dXfzlN.gIyIhA');
          if (eventResultQuery) {
            eventResult = eventResultQuery.innerText.trim();
          }
          let svgPath = element.querySelector('div > div.sc-OxbzP.cbpAKW> span > svg > path').getAttribute('d')
          let sport = getSportFromSvgPath(svgPath)

          events.push({
            sport,
            eventName,
            eventResult,
            eventTime,
            eventHome,
            eventAway,
            betDesc,
            betTechnique,
            betOdds

          })
        }


      }

      let newerFirst = (a, b) => {
        if (a && b) {
          return (new Date(a.eventTime) < new Date(b.eventTime)) ? 1 : (new Date(b.eventTime) < new Date(a.eventTime) ? -1 : 0)
        } else {
          return 1
        }
      }

      console.log('events')
      console.log(events)
      let betResultTime = 0
      if (events.sort(newerFirst)[0] !== undefined) {

        betResultTime = events.sort(newerFirst)[0].eventTime
      }
      const miseQuery = element.querySelector('div > div.sc-bOCYYb.gMnNnl > div > span:nth-child(1) > b')
      let miseString = ''
      if (miseQuery) {
        miseString = miseQuery.innerText.trim()
      }
      let oddsStr = ''
      if (type.includes('SIMPLE')) {
        oddsStr = events[0].betOdds
      } else if (type.includes('COMBIN')) {
        const oddsQuery = element.querySelector('div > div.sc-bOCYYb.gMnNnl > div > span:nth-child(2) > b')
        if (oddsQuery) {
          oddsStr = parseFloat(oddsQuery.innerText.trim().replace(',', '.'))
        }
      }
      let odds = oddsStr
      let status = ''
      const statusQuery = element.querySelector('div > div.sc-dvpmds.FamYe > div > div:nth-child(2) > span')
      if (statusQuery) {
        status = statusQuery.innerText.trim()
      }
      let betTimeClass = '.sc-clBsIJ.kvzifw'
      const betTimeQuery = element.querySelector(betTimeClass + ' .time');
      let betTime = ''
      if (betTimeQuery) {

        let betTimeStr = betTimeQuery.innerText.trim().replace('à ', '')
        betTime = convertDateStrToIsoString(betTimeStr)
      }


      let miseString2 = miseString.substr(0, miseString.indexOf('€')).replace(',', '.').trim()
      let mise = Math.round(parseFloat(miseString2) * 100) / 100
      let result = 0
      let resultString0 = ''
      let resultString1 = ''
      let resultString2 = ''
      if (status.includes('GAGN') || status.includes('CASHOUT')) {
        const resultQuery = element.querySelector('.sc-jHXLhC:nth-child(3)');
        if (resultQuery) {
          resultString0 = resultQuery.innerText.trim()
          resultString1 = resultString0.substr(resultString0.indexOf('ains') + 6, resultString0.length).trim()
          resultString2 = resultString1.substr(0, resultString1.indexOf('€')).replace(',', '.').trim();
          result = Math.round((parseFloat(resultString2) - mise) * 100) / 100;
        }
      } else if (status.includes('PERDU')) {
        result = -mise
      }

      let betTechniqueList = events.map(event => event.betTechnique)
      const allEqual = arr => arr.every(v => v == arr[0])
      betTechnique = ''
      if (allEqual(betTechniqueList)) {
        betTechnique = betTechniqueList[0]
      }

      lastBets.push({
        _id,
        type,
        status,
        // betTimeStr,
        betTime,
        betResultTime,
        // miseString,
        mise,
        odds,
        events,
        result,
        betTechnique
      })
    }
    // console.log('lastBets')
    // console.log(lastBets)
    return lastBets;
  }).catch(e => {
    console.error('Error during getBetsInPage: ', e)
    throw e
  })
  return result;
};


async function getAllWinamaxBets() {
  console.log('calling all winamax bets');
  const browser = await puppeteer.launch(launchOptions)
  let result = null
  await getWinamaxBets(browser)
    .then(res => result = res)
    .catch(e => {
      console.error('Error during getWinamaxBets: ', e)
      throw e
    });
  await browser.close()
  return result
}

// getAllWinamaxBets().then((res) => {
//   console.log(util.inspect(res, false, null, true))
//   console.log(res.length)
// });

// console.log(winamaxCreds.cryptr.decrypt(winamaxCreds.encryptedLogin))
// console.log(winamaxCreds.cryptr.decrypt(winamaxCreds.encryptedPassword))
// console.log(winamaxCreds.cryptr.decrypt(winamaxCreds.encryptedDay))
// console.log(winamaxCreds.cryptr.decrypt(winamaxCreds.encryptedMonth))
// console.log(winamaxCreds.cryptr.decrypt(winamaxCreds.encryptedYear))

module.exports = {
  getAllWinamaxBets
}