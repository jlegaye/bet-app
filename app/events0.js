let date = new Date(1565725500000)
let nextEventDateToString = date.toLocaleDateString('fr-fr', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric'
})

// fournir le jour de la semaine avec une date longue
var options = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric"
};
console.log(new Intl.DateTimeFormat("fr-FR", options).format(date));
console.log(date)
console.log(nextEventDateToString)

// Replace Intl by polyfill
Intl = require("intl")
const df = new Intl.DateTimeFormat('fr', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  timeZone: 'UTC'
});
console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)
console.log(df.format(new Date("2018-08-13T04:00:00.000Z")));

console.log(new Date().getTimezoneOffset());


var d = new Date();
var n = d.getTimezoneOffset();
var timezone = n / -60;
console.log(n);
https://www.xscores.com/soccer/leagueresults/england
console.log(df.format(new Date('2019-08-15T15:35:00+02:00')))

var moment = require('moment');
var moment_timezone = require('moment-timezone');
console.log(moment().format());
console.log(moment.utc('2019-08-13T21:45:00').format());
console.log(moment.utc('2019-08-13T21:45:00').toISOString());
console.log(moment.utc('2019-08-13T21:45:00').unix());
console.log(moment_timezone.tz.guess());
console.log(moment_timezone.tz.guess());

var zone = moment_timezone.tz.guess();
let trueDate = moment.tz('2019-08-13T21:45:00', zone)
console.log(trueDate.format())
console.log(trueDate.unix())
console.log(trueDate.utc().format())
console.log(trueDate.locale('fr').format('LLLL'))
// console.log(moment('2019-08-15T15:35:00'));
