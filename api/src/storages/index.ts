import type { User } from '#types'
import config from '#config'
import type { SdStorage } from './interface.ts'
import { nanoid } from 'nanoid'
import userName from '../utils/user-name.js'

class StorageManager {
  private _globalStorage?: SdStorage
  get globalStorage () {
    if (!this._globalStorage) throw new Error('globalStorage was not initialized')
    return this._globalStorage
  }

  async init () {
    const storage = await this.createStorage(config.storage.type, config.storage[config.storage.type])

    // Create admins and their orga at startup
    if (!storage.readonly) {
      if (config.adminsOrg) {
        const adminsOrg = await storage.getOrganization(config.adminsOrg.id)
        if (!adminsOrg) {
          await storage.createOrganization(config.adminsOrg, { id: 'init', name: 'init' })
        }
      }
      for (const adminEmail of config.admins) {
        const admin = await storage.getUserByEmail(adminEmail)
        if (!admin) {
          const newAdmin: User = {
            email: adminEmail,
            id: nanoid(),
            maxCreatedOrgs: -1,
            organizations: [],
            emailConfirmed: true,
            ignorePersonalAccount: config.onlyCreateInvited
          }
          newAdmin.name = userName(newAdmin)
          if (config.adminsOrg) {
            newAdmin.organizations?.push({ ...config.adminsOrg, role: 'admin' })
          }
          try {
            await storage.createUser(newAdmin)
          } catch (err) {
            console.error('Failure to create initial admin user', err)
          }
        }
      }
    }

    this._globalStorage = storage
  }

  async createStorage (type: string, conf: any, org?: string): Promise<SdStorage> {
    const factory = (await import('./' + type + '.ts')).default
    const storage = await factory.init(conf, org)
    storage.readonly = factory.readonly
    return storage
  }
}

const storageManager = new StorageManager()
export default storageManager

// exports.readonly = () => require('./' + config.storage.type).readonly
// exports.overwrite = () => require('./' + config.storage.type).overwrite || []
