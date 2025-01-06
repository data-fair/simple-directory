import { EventsQueue } from '@data-fair/lib-node/events-queue.js'
import config from '#config'
import Debug from 'debug'

const debug = Debug('events-queue')

let eventsQueue: EventsQueue | undefined

export default eventsQueue

export async function start () {
  if (config.secretKeys.events && config.privateEventsUrl) {
    eventsQueue = new EventsQueue()
    debug('start events queue', config.privateEventsUrl)
    await eventsQueue.start({ eventsUrl: config.privateEventsUrl, eventsSecret: config.secretKeys.events })
  } else {
    debug('events queue not started because of missing config')
  }
}

export async function stop () {
  eventsQueue?.stop()
}
