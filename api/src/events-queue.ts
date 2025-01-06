import { EventsQueue } from '@data-fair/lib-node/events-queue.js'
import config from '#config'
import Debug from 'debug'

const debug = Debug('events-queue')

const eventsQueue: EventsQueue | undefined = config.secretKeys.events && config.privateEventsUrl ? new EventsQueue() : undefined

export default eventsQueue

export async function start () {
  if (eventsQueue && config.secretKeys.events && config.privateEventsUrl) {
    debug('start events queue', config.privateEventsUrl)
    await eventsQueue.start({ eventsUrl: config.privateEventsUrl, eventsSecret: config.secretKeys.events })
  } else {
    debug('events queue not started because of missing config')
  }
}

export async function stop () {
  eventsQueue?.stop()
}
