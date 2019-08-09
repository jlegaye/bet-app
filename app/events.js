const puppeteer = require('puppeteer')
const util = require('util')
const fs = require('fs')

const nbOfSeasons = 4
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
    league: 'PRIMERA DIVISION'
  },
  // {
  //  country: 'CHILE',
  //  league: 'PRIMERA DIVISION'
  //},
  {
    country: 'COLOMBIA',
    league: 'PRIMERA A'
  }, {
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
    country: 'AUSTRIA',
    league: 'BUNDESLIGA'
  }, {
    country: 'BRAZIL',
    league: 'SERIE A',
    seasonOffset: true
  }, {
    country: 'BULGARIA',
    league: 'FIRST PROFESSIONAL FOOTBALL LEAGUE'
  }, {
    country: 'CYPRUS',
    league: 'DIVISION 1'
  }, {
    country: 'CROATIA',
    league: 'PRVA HNL'
  }, {
    country: 'DENMARK',
    league: 'SUPERLIGAEN'
  }, {
    country: 'SCOTLAND',
    league: 'SCOTTISH PREMIERSHIP'
  }, {
    country: 'FINLAND',
    league: 'VEIKKAUSLIIGA'
  }, {
    country: 'GREECE',
    league: 'SUPER LEAGUE'
  }, {
    country: 'HUNGARY',
    league: 'NB I'
  }, {
    country: 'JAPAN',
    league: 'J1 LEAGUE',
    seasonOffset: true
  }, {
    country: 'REPUBLIC OF IRELAND',
    league: 'PREMIER DIVISION'
  }, {
    country: 'NORTHERN IRELAND',
    league: 'SCOTTISH PREMIERSHIP'
  }, {
    country: 'MALTA',
    league: 'PREMIER LEAGUE'
  }, {
    country: 'MEXICO',
    league: 'LIGA MX'
  }, {
    country: 'NORWAY',
    league: 'ELITESERIEN'
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
    country: 'SLOVAKIA',
    league: 'SUPER LIGA'
  }, {
    country: 'SWEDEN',
    league: 'ALLSVENSKAN'
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
  await page.goto(leagueResultsUrl, goToOptions)
  await page.waitFor(50)
  await page.waitFor('.score_home_txt').catch(
    (err) => {
      page.reload()
      page.waitFor('.score_home_txt')
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
          let isFinished = scoreRow.querySelector('.score_time').innerText.trim().toUpperCase() == 'FIN'
          let notPost = scoreRow.querySelector('.score_time').innerText.trim().toUpperCase() !== 'POST' && scoreRow.querySelector('.score_time').innerText.trim().toUpperCase() !== 'CANC'
          let eventNotDone = scoreRow.querySelector('.score_time').innerText.trim().toUpperCase() == 'SCH'

          let eventHour = scoreRow.querySelector('.score_ko').innerText.trim()
          event.hour = eventHour
          let homeTeam = scoreRow.querySelector('.score_home_txt').innerText.trim()
          event.homeTeam = homeTeam
          let awayTeam = scoreRow.querySelector('.score_away_txt').innerText.trim()
          event.awayTeam = awayTeam

          if (isFinished) {
            let htScore = scoreRow.querySelector('.score_ht').innerText.trim()
            event.htScore = htScore


            let scoreRegex = htScore.match(/\d+/ig);
            if (scoreRegex) {
              let homeHtScore = scoreRegex[0]
              let awayHtScore = scoreRegex[1]
              event.homeHtScore = parseInt(homeHtScore)
              event.awayHtScore = parseInt(awayHtScore)
              event.halfTimeDraw = homeHtScore == awayHtScore
              event.halfTimeWoGoal = homeHtScore == 0 && awayHtScore == 0
            }

            let ftScore = scoreRow.querySelector('.score_score').innerText.trim()
            event.ftScore = ftScore


            let ftScoreRegex = ftScore.match(/\d+/ig);
            if (ftScoreRegex) {
              let homeFtScore = ftScoreRegex[0]
              let awayFtScore = ftScoreRegex[1]
              event.homeFtScore = parseInt(homeFtScore)
              event.awayFtScore = parseInt(awayFtScore)
              event.fullTimeDraw = homeFtScore == awayFtScore
              event.fullTimeWoGoal = homeFtScore == 0 && awayFtScore == 0
            }
          }
          events.push(event)
        } else {
          // date
          let date = scoreRow.innerText.trim()
          if (date.includes('-')) {
            event.date = date
            events.push(event)
          }
        }
      }

      let eventsWithDate = []
      let currentDate = ''
      for (var ev of events) {
        if (ev.date) {
          let eventDateStr = ev.date
          let eventDateSplitted = eventDateStr.split('-')
          currentDate = eventDateSplitted[2] + '-' + eventDateSplitted[1] + '-' + eventDateSplitted[0]
        } else {
          let builtDate = currentDate + 'T' + ev.hour + ':00'
          let nextEventDate = new Date(builtDate)
          let nextEventDateGetTime = nextEventDate.getTime()
          let nextEventDateToString = nextEventDate.toLocaleDateString('en-us', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
          })
          ev.dateString = nextEventDateToString
          ev.date = nextEventDateGetTime
          delete ev.hour
          ev['_id'] = nextEventDateGetTime + '_' + ev.homeTeam.replace(/ /g, '_') + '_' + ev.awayTeam.replace(/ /g, '_')
          eventsWithDate.push(ev)
        }
      }

      data = eventsWithDate

      return data;
    }
  )

  await page.close()
  return leagueResults
}

async function getSoccerLeagueUrls(browser, country, league, seasonOffset) {

  let leagueEventsUrls = []
  const page = await browser.newPage()

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


function resolveAllSoccerLeagues(browser, country, league) {
  return new Promise(resolve => {

    let allTeamsUrls = []
    let allResults = []

    leagues.filter(item => item.country == country && item.league == league).reduce((promise, nextLeague) => {
      return promise
        .then((result) => {
          return getSoccerTeamUrls(browser, nextLeague.country, nextLeague.league, nextLeague.seasonOffset).then(teamUrls => {
            allTeamsUrls.push(teamUrls)

          });
        })
        .catch(console.error);
    }, Promise.resolve()).then(r => {
      // console.log(util.inspect(allTeamsUrls, false, null, false))
      let flattenAllTeamsUrls = [].concat.apply([], allTeamsUrls)

      flattenAllTeamsUrls.reduce((promise, nextTeamWithUrls) => {
        return promise
          .then((result) => {
            return resolveTeamAndUrls(browser, nextTeamWithUrls).then(teamUrls => {
              allResults.push(teamUrls)

            });
          })
          .catch(console.error);
      }, Promise.resolve()).then(r => {
        let flattenAllTeamsResolutions = [].concat.apply([], allResults)

        // let filteredAllTeamsResolutions = flattenAllTeamsResolutions.filter(team => team.nextEvent != undefined && team.mustBet && team.maxNoDrawAtHTIteration < 10 && team.nbEvents > 20)
        let filteredAllTeamsResolutions = flattenAllTeamsResolutions.filter(team => team.nextEvent != undefined && team.mustBetGoalAtHT && team.nbEvents > 20)

        let sorted = filteredAllTeamsResolutions.sort(olderFirst)
        let map = sorted.map(teamEvents => {
          return {
            name: teamEvents.name,
            country: teamEvents.country,
            league: teamEvents.league,
            nextEvent: teamEvents.nextEvent.nextEventHome + ' VS ' + teamEvents.nextEvent.nextEventAway,
            nextEventDate: teamEvents.nextEvent.nextEventDateString,
            // mustBetDrawAtHT : teamEvents.mustBetDrawAtHT,
            // maxNoDrawAtHTIteration: teamEvents.maxNoDrawAtHTIteration,
            mustBetGoalAtHT: teamEvents.mustBetGoalAtHT,
            maxNoWoGoalAtHTIteration: teamEvents.maxNoWoGoalAtHTIteration,
            nbEvents: teamEvents.nbEvents
          }
        })

        resolve(map)
      })
    })
  })
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

// getAllEvents('USA', 'MAJOR LEAGUE SOCCER').then((res) => {
//   // stringify JSON Object
//   var jsonContent = JSON.stringify(res);
//
//   fs.writeFile("output_USA.json", jsonContent, 'utf8', function(err) {
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
  getAllEvents,
  getAllEventsByCountryAndLeague
};
