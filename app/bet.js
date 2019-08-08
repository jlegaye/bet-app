const puppeteer = require('puppeteer')
const util = require('util')

const launchOptions = {  
  headless: true
}

const goToOptions = {
  timeout: 20000,
  waitUntil: 'networkidle0'
}

const leagues = [
  {
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

async function resolveTeamUrl(browser, teamUrl) {
  console.log('teamUrl: ' + teamUrl)
  const page = await browser.newPage()
  await page.goto(teamUrl, goToOptions)
  await page.waitFor(50)
  await page.waitFor('.match_line').catch(
    (err) => {
      page.reload()
      page.waitFor('.match_line')
    }
  )

  const halfTimeEvents = await page.evaluate(() =>

    {
      let data = {}

      // let breadcrumb = document.querySelector('.seven').length;
      let elements = document.querySelectorAll('.match_line');
      let events = []
      let nextEventFound = false
      for (var element of elements) {
        let event = {}
        let isFinished = element.querySelector('.score_ko').innerText.trim() == 'FIN'
        let notPost = element.querySelector('.score_ko').innerText.trim() !== 'POST' && element.querySelector('.score_ko').innerText.trim() !== 'CANC'
        let eventNotDone = element.querySelector('.score_ht').innerText.trim() == '-'
        // console.log(eventNotDone)
        // console.log(element.querySelector('.score_ht').innerText.trim())
        if (isFinished) {
          let htScore = element.querySelector('.score_ht').innerText.trim()
          event.htScore = htScore


          let scoreRegex = htScore.match(/\d+/ig);
          if (scoreRegex) {
            let homeHtScore = scoreRegex[0]
            let awayHtScore = scoreRegex[1]
            event.halfTimeDraw = homeHtScore == awayHtScore
            event.halfTimeWoGoal = homeHtScore == 0 && awayHtScore == 0
          }
          events.push(event)
        } else if (eventNotDone && notPost && !nextEventFound) {
          nextEventFound = true
          let nextEventDateString = element.querySelector('.score_time').innerText.trim()
          let dateSplitted = nextEventDateString.split('-')
          let nextEventTime = element.querySelector('.score_ko').innerText.trim()
          let builtDate = dateSplitted[2] + '-' + dateSplitted[1] + '-' + dateSplitted[0] + 'T' + nextEventTime + ':00'
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
          let nextEventHome = element.querySelector('.score_home_txt').innerText.trim()
          let nextEventAway = element.querySelector('.score_away_txt').innerText.trim()
          let nextEvent = {}
          nextEvent.nextEventDate = nextEventDateGetTime
          nextEvent.nextEventDateString = nextEventDateToString
          nextEvent.nextEventHome = nextEventHome
          nextEvent.nextEventAway = nextEventAway
          data.nextEvent = nextEvent
        }
      }


      data.events = events

      return data;
    }
  )

  await page.close()
  return halfTimeEvents
}


async function resolveTeamAndUrls(browser, teamAndUrls) {
  return new Promise(resolve => {
    let allEventsTeam = []
    let nextEventTeam
    teamAndUrls.urls.reduce((promise, nextTeamUrl) => {
      return promise
        .then((result) => {
          return resolveTeamUrl(browser, nextTeamUrl).then(teamEvents => {
            if (teamEvents.nextEvent !== undefined) {
              nextEventTeam = teamEvents.nextEvent
            }
            allEventsTeam.push(teamEvents.events)


          });
        })
        .catch(console.error);
    }, Promise.resolve()).then(r => {
      var allEventsTeam2 = [].concat.apply([], allEventsTeam);
      // console.log(util.inspect(allEventsTeam2, false, null, false))
      // let flattenAllTeamsUrls = [].concat.apply([], allTeamsUrls)
      let team = {}
      team.name = teamAndUrls.name
      team.country = teamAndUrls.country
      team.league = teamAndUrls.league
      team.nbEvents = allEventsTeam2.length

      // HALF TIME DRAW
      let isHTDrawList = allEventsTeam2.map(event => event.halfTimeDraw)
      let maxNoDrawAtHTIteration = 0
      let cpt = 0
      for (var item of isHTDrawList) {
        if (!item) {
          cpt++
        } else {
          cpt = 0
        }
        if (cpt > maxNoDrawAtHTIteration) {
          maxNoDrawAtHTIteration = cpt
        }
      }
      team.maxNoDrawAtHTIteration = maxNoDrawAtHTIteration
      let mustBetDrawAtHT = true
      let i = allEventsTeam2.length - 1
      while (i > (allEventsTeam2.length - (maxNoDrawAtHTIteration)) && mustBetDrawAtHT) {
        if (allEventsTeam2[i].halfTimeDraw) {
          mustBetDrawAtHT = false;
        }
        i--;
      }

      // HALF TIME 0-0
      let isHTWoGoalList = allEventsTeam2.map(event => event.halfTimeWoGoal)
      let maxNoWoGoalAtHTIteration = 0
      cpt = 0
      for (var item of isHTWoGoalList) {
        if (item) {
          cpt++
        } else {
          cpt = 0
        }
        if (cpt > maxNoWoGoalAtHTIteration) {
          maxNoWoGoalAtHTIteration = cpt
        }
      }
      team.maxNoWoGoalAtHTIteration = maxNoWoGoalAtHTIteration
      let mustBetGoalAtHT = true
      i = allEventsTeam2.length - 1
      while (i > (allEventsTeam2.length - (maxNoWoGoalAtHTIteration + 1)) && mustBetGoalAtHT) {
        if (!allEventsTeam2[i].halfTimeWoGoal) {
          mustBetGoalAtHT = false;
        }
        i--;
      }

      team.mustBet = mustBetDrawAtHT || mustBetGoalAtHT
      team.mustBetDrawAtHT = mustBetDrawAtHT
      team.mustBetGoalAtHT = mustBetGoalAtHT
      team.nextEvent = nextEventTeam

      resolve(team)
    })
  })

}

async function getSoccerTeamUrls(browser, country, league, seasonOffset) {

  const currentSeasonYear = seasonOffset ? 2019 : 2020
  const currentSeason = (currentSeasonYear - 1) + '-' + currentSeasonYear
  const previousSeason = (currentSeasonYear - 2) + '-' + (currentSeasonYear - 1)
  const previous2Season = (currentSeasonYear - 3) + '-' + (currentSeasonYear - 2)
  const previous3Season = (currentSeasonYear - 4) + '-' + (currentSeasonYear - 3)
  const page = await browser.newPage()

  let lastSeasonLeagueUrl = getLeagueUrl(country, league, currentSeason)
  console.log('lastSeasonLeagueUrl: ' + lastSeasonLeagueUrl)
  await page.goto(lastSeasonLeagueUrl, goToOptions)
  await page.reload()
  await page.waitFor(50)
  await page.waitFor('.table_row').catch(
    (err) => {
      console.log('catch !!')
      page.goto(lastSeasonLeagueUrl, goToOptions)
      page.waitFor('.table_row')
    }
  )
  const lastSeasonsUrls = await page.evaluate(getTeamUrls)
  const lastSeasonTeams = lastSeasonsUrls.teams.map(team => team.name)

  let previousSeasonLeagueUrl = getLeagueUrl(country, league, previousSeason)
  console.log('previousSeasonLeagueUrl: ' + previousSeasonLeagueUrl)
  await page.goto(previousSeasonLeagueUrl, goToOptions)
  await page.waitFor(50)
  await page.waitFor('.table_row').catch(
    (err) => {
      page.reload()
      page.waitFor('.table_row')
    }
  )
  const previousSeasonUrls = await page.evaluate(getTeamUrls)

  let previous2SeasonLeagueUrl = getLeagueUrl(country, league, previous2Season)
  console.log('previous2SeasonLeagueUrl: ' + previous2SeasonLeagueUrl)
  await page.goto(previous2SeasonLeagueUrl, goToOptions)
  await page.waitFor(50)
  await page.waitFor('.table_row').catch(
    (err) => {
      page.reload()
      page.waitFor('.table_row')
    }
  )
  const previous2SeasonUrls = await page.evaluate(getTeamUrls)

  let previous3SeasonLeagueUrl = getLeagueUrl(country, league, previous3Season)
  console.log('previous3SeasonLeagueUrl: ' + previous3SeasonLeagueUrl)
  await page.goto(previous3SeasonLeagueUrl, goToOptions)
  await page.waitFor(50)
  await page.waitFor('.table_row').catch(
    (err) => {
      page.reload()
      page.waitFor('.table_row')
    }
  )
  const previous3SeasonUrls = await page.evaluate(getTeamUrls)

  let previousSeaonTeams = previousSeasonUrls.teams.filter(team => lastSeasonTeams.includes(team.name))
  let previous2SeaonTeams = previous2SeasonUrls.teams.filter(team => lastSeasonTeams.includes(team.name))
  let previous3SeaonTeams = previous3SeasonUrls.teams.filter(team => lastSeasonTeams.includes(team.name))

  for (var team of lastSeasonsUrls.teams) {
    let teamName = team.name
    if (previousSeaonTeams.map(team => team.name).includes(teamName)) {
      let url = previousSeaonTeams.filter(team => team.name == teamName)[0].urls[0]
      team.urls.unshift(url)
    }
    if (previous2SeaonTeams.map(team => team.name).includes(teamName)) {
      let url = previous2SeaonTeams.filter(team => team.name == teamName)[0].urls[0]
      team.urls.unshift(url)
    }
    if (previous3SeaonTeams.map(team => team.name).includes(teamName)) {
      let url = previous3SeaonTeams.filter(team => team.name == teamName)[0].urls[0]
      team.urls.unshift(url)
    }
  }

  await page.close()
  return lastSeasonsUrls.teams


}

let getLeagueUrl = (country, league, season) => {
  country = country.toLowerCase().replace(/ /g, '-')
  league = league.toLowerCase().replace(/ /g, '-')
  return 'https://www.xscores.com/soccer/standings/' + country + '/' + league + '/' + season + '/l/group/0'
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

let olderFirst = (a, b) => {
  if (a.nextEvent !== undefined && b.nextEvent !== undefined) {
    return (a.nextEvent.nextEventDate > b.nextEvent.nextEventDate) ? 1 : ((b.nextEvent.nextEventDate > a.nextEvent.nextEventDate) ? -1 : 0)
  } else if (a.nextEvent == undefined) {
    return -1
  } else {
    return 1
  }
}

async function resolveSoccer(country, league) {
  const browser = await puppeteer.launch(launchOptions);
  var result = await resolveAllSoccerLeagues(browser, country, league);
  await browser.close()
  return result
}

// resolveSoccer().then((res) => console.log(util.inspect(res, false, null, false)));

module.exports = {
  resolveSoccer
};
