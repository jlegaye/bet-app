const puppeteer = require('puppeteer')
const util = require('util')
const fs = require('fs')
// const moment = require('moment')
// const moment_timezone = require('moment-timezone')

let nbOfSeasons = 10
const launchOptions = {
  headless: true,
  args: ['--no-sandbox']
}

const goToOptions = {
  timeout: 20000,
  waitUntil: 'networkidle0'
}

const leagues = [{
    country: 'FRANCE',
    league: 'LIGUE 1'
  }, {
    country: 'FRANCE',
    league: 'LIGUE 2'
  }, {
    country: 'ENGLAND',
    league: 'PREMIER LEAGUE'
  }, {
    country: 'ENGLAND',
    league: 'CHAMPIONSHIP'
  }, {
    country: 'GERMANY',
    league: 'BUNDESLIGA'
  }, {
    country: 'GERMANY',
    league: '2. BUNDESLIGA'
  }, {
    country: 'SPAIN',
    league: 'PRIMERA DIVISION'
  }, {
    country: 'SPAIN',
    league: 'SEGUNDA DIVISION'
  }, {
    country: 'ITALY',
    league: 'SERIE A'
  }, {
    country: 'ITALY',
    league: 'SERIE B'
  }, {
    country: 'PORTUGAL',
    league: 'PRIMEIRA LIGA'
  }, {
    country: 'ARGENTINA',
    league: 'SUPERLIGA'
  },
  // {
  //  country: 'CHILE',
  //  league: 'PRIMERA DIVISION'
  //},
  {
    country: 'RUSSIA',
    league: 'RUSSIAN FOOTBALL PREMIER LEAGUE'
  }, {
    country: 'USA',
    league: 'MAJOR LEAGUE SOCCER',
    seasonOffset: true
  }, {
    country: 'ALGERIA',
    league: 'LIGUE 1'
  }, {
    country: 'ARMENIA',
    league: 'PREMIER LEAGUE'
  }, {
    country: 'AUSTRIA',
    league: 'BUNDESLIGA'
  }, {
    country: 'AZERBAIJAN',
    league: 'PREMIER LEAGUE'
  }, {
    country: 'BELARUS',
    league: 'PREMIER LEAGUE',
    seasonOffset: true
  }, {
    country: 'BRAZIL',
    league: 'SERIE A',
    seasonOffset: true
  }, {
    country: 'BULGARIA',
    league: 'FIRST PROFESSIONAL FOOTBALL LEAGUE'
  }, {
    country: 'COLOMBIA',
    league: 'PRIMERA A'
  }, {
    country: 'CYPRUS',
    league: 'DIVISION 1'
  }, {
    country: 'CROATIA',
    league: 'PRVA HNL'
  }, {
    country: 'DENMARK',
    league: 'SUPERLIGAEN'
  },
  {
    country: 'ESTONIA',
    league: 'MEISTRILIIGA',
    seasonOffset: true
  }, {
    country: 'SCOTLAND',
    league: 'SCOTTISH PREMIERSHIP'
  }, {
    country: 'FINLAND',
    league: 'VEIKKAUSLIIGA',
    seasonOffset: true
  }, {
    country: 'GREECE',
    league: 'SUPER LEAGUE 1'
  }, {
    country: 'HUNGARY',
    league: 'NB I'
  }, {
    country: 'JAPAN',
    league: 'J1 LEAGUE',
    seasonOffset: true
  }, {
    country: 'KAZAKHSTAN',
    league: 'PREMIER LEAGUE',
    seasonOffset: true
  }, {
    country: 'REPUBLIC OF IRELAND',
    league: 'PREMIER DIVISION',
    seasonOffset: true
  }, {
    country: 'NORTHERN IRELAND',
    league: 'NIFL PREMIERSHIP'
  }, {
    country: 'MALTA',
    league: 'PREMIER LEAGUE'
  }, {
    country: 'MEXICO',
    league: 'LIGA MX'
  }, {
    country: 'MONTENEGRO',
    league: 'PRVA CFL'
  }, {
    country: 'NORWAY',
    league: 'ELITESERIEN',
    seasonOffset: true
  }, {
    country: 'WALES',
    league: 'WELSH PREMIER LEAGUE'
  }, {
    country: 'NETHERLANDS',
    league: 'EREDIVISIE'
  }, {
    country: 'POLAND',
    league: 'EKSTRAKLASA'
  }, {
    country: 'CZECH REPUBLIC',
    league: 'DIVISION 1'
  }, {
    country: 'ROMANIA',
    league: 'LIGA I'
  }, {
    country: 'SERBIA',
    league: 'SUPERLIGA'
  }, {
    country: 'SLOVAKIA',
    league: 'SUPER LIGA'
  }, {
    country: 'SWEDEN',
    league: 'ALLSVENSKAN',
    seasonOffset: true
  }, {
    country: 'SWITZERLAND',
    league: 'SUPER LEAGUE'
  }, {
    country: 'TURKEY',
    league: 'SUPER LIG'
  }, {
    country: 'UKRAINE',
    league: 'PREMIER LEAGUE'
  }
]


async function extractEventsResultsFromLeagueUrl(browser, leagueResultsUrl) {
  console.log('leagueResultsUrl: ' + leagueResultsUrl)
  const page = await browser.newPage()
  page.setDefaultNavigationTimeout(5000)
  await page.goto(leagueResultsUrl, goToOptions).catch((error) => {
    console.log('Cannot go to ' + leagueResultsUrl)
    console.log(error)
  })
  await page.waitFor(50)
  await page.waitFor('.score_home_txt').catch(
    (err) => {
      console.log(err)
      page.reload().catch(
        (error) => {
          console.log("No match for the moment for this seaon!!!")
        })
      page.waitFor('.score_home_txt').catch(
        (error) => {
          console.log("No match for the moment for this seaon!!!")
        })
    }
  )

  const leagueResults = await page.evaluate(() =>

    {
      let data = {}
      let currentChoices = document.querySelectorAll('.current')
      let scoreRows = document.querySelectorAll('.score_row')
      let events = []

      for (var scoreRow of scoreRows) {
        let event = {}
        event.country = currentChoices[0].innerText.trim()
        event.league = currentChoices[1].innerText.trim()
        if (currentChoices[4] !== undefined) {
          event.season = currentChoices[4].innerText.trim()
        } else {
          event.season = currentChoices[3].innerText.trim()
        }

        let isMatchLine = scoreRow.querySelector('.score_ko') !== null && scoreRow.querySelector('.score_ko').innerText.trim() !== ''
        if (isMatchLine) {
          let status = scoreRow.querySelector('.score_time').innerText.trim().toUpperCase()
          let isFinished = status == 'FIN'
          /*let notPost = status !== 'POST' && status !== 'CANC'
          let eventNotDone = status == 'SCH'*/
          event.status = status
          let eventHour = scoreRow.querySelector('.score_ko').innerText.trim()
          event.hour = eventHour
          let homeTeam = scoreRow.querySelector('.score_home_txt').innerText.trim()
          event.homeTeam = homeTeam
          let awayTeam = scoreRow.querySelector('.score_away_txt').innerText.trim()
          event.awayTeam = awayTeam

          if (isFinished) {
            let halfTime1Score = scoreRow.querySelector('.score_ht').innerText.trim()
            event.halfTime1Score = halfTime1Score


            let scoreRegex = halfTime1Score.match(/\d+/ig);
            if (scoreRegex) {
              let halfTime1HomeScore = scoreRegex[0]
              let halfTime1AwayScore = scoreRegex[1]
              let homeHt1ScoreInt = parseInt(halfTime1HomeScore)
              let awayHt1ScoreInt = parseInt(halfTime1AwayScore)
              event.halfTime1HomeScore = homeHt1ScoreInt
              event.halfTime1AwayScore = awayHt1ScoreInt
              let halfTime1Goals = homeHt1ScoreInt + awayHt1ScoreInt
              event.halfTime1Goals = halfTime1Goals
              event.halfTime1Draw = homeHt1ScoreInt == awayHt1ScoreInt
              event.halfTime1NoGoal = halfTime1Goals == 0
            }

            let fullTimeScore = scoreRow.querySelector('.score_score').innerText.trim()
            event.fullTimeScore = fullTimeScore


            let ftScoreRegex = fullTimeScore.match(/\d+/ig);
            if (ftScoreRegex) {
              let fullTimeHomeScore = ftScoreRegex[0]
              let fullTimeAwayScore = ftScoreRegex[1]
              let homeFtScoreInt = parseInt(fullTimeHomeScore)
              let awayFtScoreInt = parseInt(fullTimeAwayScore)
              event.fullTimeHomeScore = homeFtScoreInt
              event.fullTimeAwayScore = awayFtScoreInt
              let fullTimeGoals = homeFtScoreInt + awayFtScoreInt
              event.fullTimeGoals = fullTimeGoals
              event.fullTimeDraw = homeFtScoreInt == awayFtScoreInt
              event.fullTimeNoGoal = fullTimeGoals == 0

              let homeHt2ScoreInt = homeFtScoreInt - event.halfTime1HomeScore
              let awayHt2ScoreInt = awayFtScoreInt - event.halfTime1AwayScore
              event.halfTime2HomeScore = homeHt2ScoreInt
              event.halfTime2AwayScore = awayHt2ScoreInt
              let halfTime2Goals = homeHt2ScoreInt + awayHt2ScoreInt
              event.halfTime2Goals = halfTime2Goals
              event.halfTime2Draw = homeHt2ScoreInt == awayHt2ScoreInt
              event.halfTime2NoGoal = halfTime2Goals == 0

              event.secondHalfBetter = event.halfTime2Goals > event.halfTime1Goals
              event.twoOrThreeGoals = event.fullTimeGoals == 2 || event.fullTimeGoals == 3
            }
          }
          events.push(event)
        } else {
          // date
          let date = scoreRow.innerText.trim()
          if (date.includes('-')) {
            event.date = date
            events.push(event)
          } else {
            event.round = date
            events.push(event)
          }
        }
      }

      let eventsWithDate = []
      let currentDate = ''
      let currentRound = ''
      // console.log('events !!!!')
      // console.log(events)
      for (var ev of events) {
        if (ev.round) {
          currentRound = parseInt(ev.round.substring(6))
        } else if (ev.date) {
          let eventDateStr = ev.date
          let eventDateSplitted = eventDateStr.split('-')
          currentDate = eventDateSplitted[2] + '-' + eventDateSplitted[1] + '-' + eventDateSplitted[0]
        } else {
          let builtDate = currentDate + 'T' + ev.hour + ':00'

          // let zone = moment_timezone.tz.guess();
          // let trueDate = getDate(builtDate)
          let utcIsoDate = new Date(new Date(builtDate).getTime()).toISOString()
          ev.date = utcIsoDate
          ev.round = currentRound
          delete ev.hour
          ev['_id'] = ev.homeTeam.replace(/ /g, '_') + '__' + ev.awayTeam.replace(/ /g, '_') + '___' + ev.country.replace(/ /g, '_') + '__' + ev.league.replace(/ /g, '_') + '__' + ev.season.replace(/ /g, '_')
          eventsWithDate.push(ev)
        }
      }
      for (var ev of events) {
        ev.nbOfRounds = currentRound
      }

      data = eventsWithDate

      return data;
    }
  ).catch((error) => {
    console.log(error)
  })

  await page.close()
  return leagueResults
}

async function getSoccerLeagueUrls(browser, country, league, seasonOffset) {

  let leagueEventsUrls = []
  const page = await browser.newPage()
  page.setDefaultNavigationTimeout(5000)

  let i = 0
  while (i < nbOfSeasons) {
    let currentSeasonYear = seasonOffset ? 2019 : 2020
    let year1 = Number(currentSeasonYear) - (1 + Number(i))
    let year2 = Number(currentSeasonYear) - Number(i)
    let currentSeason = year1 + '-' + year2
    let seasonLeagueUrl = getLeagueUrl(country, league, currentSeason)
    leagueEventsUrls.push(seasonLeagueUrl)
    i++
  }

  await page.close()
  return leagueEventsUrls


}

let getLeagueUrl = (country, league, season) => {
  country = country.toLowerCase().replace(/ /g, '-')
  league = league.toLowerCase().replace(/ /g, '-')
  return 'https://www.xscores.com/soccer/leagueresults/' + country + '/' + league + '/' + season
}

let getTeamUrls = () => {
  let data = {}
  let lines = document.querySelectorAll('.table_row');
  data.teams = []
  for (var line of lines) {
    if (line.querySelector('.rank_pos')) {
      let teamName = line.querySelector('.table_team').innerText.trim()
      let onclick = line.querySelector('a').getAttribute('onclick')

      onclick = onclick.replace('teamData(\'', '')
      onclick = onclick.replace(/\',\'/g, '|')
      onclick = onclick.replace(/\'\)/g, '')
      let split = onclick.split('|')

      let country = split[0].toLowerCase().replace(/ /g, '-')
      let league = split[2].toLowerCase().replace(/ /g, '-')
      let season = split[1].toLowerCase().replace(/ /g, '-')
      let team = split[7].toLowerCase().replace(/ /g, '-')
      let idTeam = split[4].toLowerCase().replace(/ /g, '-')
      let letter = split[5].toLowerCase().replace(/ /g, '-')
      let link = 'https://www.xscores.com/soccer/team-results/' + country + '/' + league + '/' + season + '/' + team + '/' + idTeam + '/' + letter
      let teamObj = {}
      teamObj.name = teamName
      teamObj.country = country
      teamObj.league = league
      teamObj.urls = []
      teamObj.urls.push(link)
      data.teams.push(teamObj)
    }
  }
  return data;
}

function getAllSoccerEvents(browser) {
  return new Promise(resolve => {

    let allLeaguesUrls = []
    let allResults = []

    leagues.reduce((promise, nextLeague) => {
      return promise
        .then((result) => {
          return getSoccerLeagueUrls(browser, nextLeague.country, nextLeague.league, nextLeague.seasonOffset).then(leagueUrls => {
            allLeaguesUrls.push(leagueUrls)

          });
        })
        .catch(console.error);
    }, Promise.resolve()).then(r => {
      // console.log(util.inspect(allLeaguesUrls, false, null, false))
      let flattenAllTeamsUrls = [].concat.apply([], allLeaguesUrls)
      // console.log(util.inspect(flattenAllTeamsUrls, false, null, false))
      flattenAllTeamsUrls.reduce((promise, nextTeamWithUrls) => {
        return promise
          .then((result) => {
            return extractEventsResultsFromLeagueUrl(browser, nextTeamWithUrls).then(teamUrls => {
              allResults.push(teamUrls)

            });
          })
          .catch(console.error);
      }, Promise.resolve()).then(r => {
        let flattenAllTeamsResolutions = [].concat.apply([], allResults)
        resolve(flattenAllTeamsResolutions)
      })
    })
  })
}

function getAllSoccerEventsByCountryAndLeague(browser, country, league) {
  return new Promise(resolve => {

    let allLeaguesUrls = []
    let allResults = []

    leagues.filter(item => item.country == country && item.league == league).reduce((promise, nextLeague) => {
      return promise
        .then((result) => {
          return getSoccerLeagueUrls(browser, nextLeague.country, nextLeague.league, nextLeague.seasonOffset).then(leagueUrls => {
            allLeaguesUrls.push(leagueUrls)

          });
        })
        .catch(console.error);
    }, Promise.resolve()).then(r => {
      // console.log(util.inspect(allLeaguesUrls, false, null, false))
      let flattenAllTeamsUrls = [].concat.apply([], allLeaguesUrls)
      // console.log(util.inspect(flattenAllTeamsUrls, false, null, false))
      flattenAllTeamsUrls.reduce((promise, nextTeamWithUrls) => {
        return promise
          .then((result) => {
            return extractEventsResultsFromLeagueUrl(browser, nextTeamWithUrls).then(teamUrls => {
              allResults.push(teamUrls)

            });
          })
          .catch(console.error);
      }, Promise.resolve()).then(r => {
        let flattenAllTeamsResolutions = [].concat.apply([], allResults)
        resolve(flattenAllTeamsResolutions)
      })
    })
  })
}

let olderFirst = (a, b) => {
  if (a.nextEvent !== undefined && b.nextEvent !== undefined) {
    return (a.nextEvent.nextEventDate > b.nextEvent.nextEventDate) ? 1 : ((b.nextEvent.nextEventDate > a.nextEvent.nextEventDate) ? -1 : 0)
  } else if (a.nextEvent == undefined) {
    return -1
  } else {
    return 1
  }
}


async function getAllEventsByCountryAndLeague(country, league) {
  console.log('getAllEvents')
  const browser = await puppeteer.launch(launchOptions);
  var result = await getAllSoccerEventsByCountryAndLeague(browser, country, league);
  await browser.close()
  return result
}

async function getAllEvents() {
  console.log('getAllEvents')
  const browser = await puppeteer.launch(launchOptions);
  var result = await getAllSoccerEvents(browser);
  await browser.close()
  return result
}

async function getAllLastSeasonEvents() {
  console.log('getAllEvents')
  nbOfSeasons = 1
  const browser = await puppeteer.launch(launchOptions);
  var result = await getAllSoccerEvents(browser);
  await browser.close()
  return result
}

// getAllEventsByCountryAndLeague('NORTHERN IRELAND', 'NIFL PREMIERSHIP').then((res) => {
//   // stringify JSON Object
//   var jsonContent = JSON.stringify(res);
//
//   fs.writeFile("output_NORTHERN_IRELAND.json", jsonContent, 'utf8', function(err) {
//     if (err) {
//       console.log("An error occured while writing JSON Object to File.");
//       return console.log(err);
//     }
//
//     console.log("JSON file has been saved.");
//   });
//   console.log(util.inspect(res, false, null, false))
// });

module.exports = {
  getAllLastSeasonEvents,
  getAllEvents,
  getAllEventsByCountryAndLeague
};
