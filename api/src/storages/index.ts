import type { Organization, UserWritable } from '#types'
import config from '#config'
import type { SdStorage, SdStorageFactory } from './interface.ts'
import { nanoid } from 'nanoid'
import defaultConfig from '../../config/default.cjs'

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
          const newAdmin: UserWritable = {
            email: adminEmail,
            id: nanoid(),
            maxCreatedOrgs: -1,
            organizations: [],
            emailConfirmed: true,
            ignorePersonalAccount: config.onlyCreateInvited
          }
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

  async createStorage (type: string, conf: any, org?: Organization): Promise<SdStorage> {
    const factory = (await import('./' + type + '.ts')) as SdStorageFactory
    const storage = await factory.init(conf, org)
    storage.readonly = factory.readonly
    return storage
  }

  async createOrgStorage (org: Organization): Promise<SdStorage | undefined> {
    if (!org.orgStorage?.active || !config.perOrgStorageTypes.includes(org.orgStorage.type)) return
    return this.createStorage(org.orgStorage.type, { ...defaultConfig.storage[org.orgStorage.type], ...org.orgStorage.config }, org)
  }
}

const storageManager = new StorageManager()
export default storageManager

// export const  readonly = () => require('./' + config.storage.type).readonly
// export const  overwrite = () => require('./' + config.storage.type).overwrite || []
