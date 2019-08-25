const Cryptr = require('cryptr');
const cryptr = new Cryptr('Voici une clef vraiment secrète');
const encryptedLogin = '2302f0ee36517709f5933e9eba751810ecb78071d3c892bc322b4d04b302aa476f1ff2d5ac7dbf'
const encryptedPassword = '5a54d5cd6fcb0b8c5ca6052a3a07176fbde753d9e707be0b8b6f17df89bdfe25b0b526d4'
const encryptedDay = '5126ba696000c091e1c4a4b7c0b4bd68551f'
const encryptedMonth = 'b7623361ccaddf9ee251c826c88abd3a9ed4'
const encryptedYear = 'aee9bf59bd75d0dd1a216992aca0ffb8bf8d75be'

// console.log('encryptedLogin: ' + encryptedLogin)
// console.log('encryptedPassword: ' + enPassword)
// console.log('encryptedDay: ' + encryptedDay)
// console.log('encryptedMonth: ' + encryptedMonth)
// console.log('encryptedYear: ' + encryptedYear)

module.exports = {
  cryptr,
  encryptedLogin,
  encryptedPassword,
  encryptedDay,
  encryptedMonth,
  encryptedYear
};
