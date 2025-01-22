import readline from 'node:readline'
import { Writable } from 'node:stream'
import { hashPassword, validatePassword } from '../src/utils/passwords.ts'

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
  const email = await new Promise<string>((resolve) => rl.question('email: ', resolve))
  const passwordPromise = new Promise<string>((resolve) => rl.question('password: ', resolve))
  muted = true
  const password = await passwordPromise
  if (!validatePassword(password)) throw new Error('password does not respect complexity rules')
  const hash = await hashPassword(password)
  console.log(JSON.stringify({ email, password: hash }))
  rl.close()
}

main()
