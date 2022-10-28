const readline = require('node:readline')
const { Writable } = require('node:stream')
const passwordUtils = require('../server/utils/passwords')

async function main () {
  let muted = false
  const rl = readline.createInterface({
    input: process.stdin,
    output: new Writable({
      write: function (chunk, encoding, cb) {
        if (muted && chunk.toString() !== '\r\n') process.stdout.write('*')
        else process.stdout.write(chunk)
        cb()
      }
    }),
    terminal: true
  })
  const email = await new Promise((resolve) => rl.question('email: ', resolve))
  const passwordPromise = new Promise((resolve) => rl.question('password: ', resolve))
  muted = true
  const password = await passwordPromise
  if (!passwordUtils.validate(password)) throw new Error('password does not respect complexity rules')
  const hash = await passwordUtils.hashPassword(password)
  console.log(JSON.stringify({ email, password: hash }))
  rl.close()
}

main()
