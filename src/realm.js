import * as Realm from 'realm-web'

const realmAppId = 'watch-example-mydoj'
const realmDbName = 'oliver-oe40-development'

// Create the Realm app (if not already created)
export const realmApp = new Realm.App({ id: realmAppId })

// Initialize Realm Query Anywhere
export const mongodb = realmApp.services.mongodb('mongodb-atlas')
export const countersCollection = mongodb.db(realmDbName).collection('watchexamplecounters')

// Login with Auth0
export const login = () => realmApp.logIn(Realm.Credentials.anonymous())
