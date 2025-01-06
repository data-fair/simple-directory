import { EventsQueue } from '@data-fair/lib-node/events-queue.js'
import config from '#config'

let eventsQueue: EventsQueue | undefined

export default eventsQueue

export async function start () {
  if (config.secretKeys.events && config.privateEventsUrl) {
    eventsQueue = new EventsQueue()
    await eventsQueue.start({ eventsUrl: config.privateEventsUrl, eventsSecret: config.secretKeys.events })
  }
}

export async function stop () {
  eventsQueue?.stop()
}
