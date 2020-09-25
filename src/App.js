import React, { PureComponent } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { login, countersCollection } from './realm'

import './App.css'

class App extends PureComponent {
  state = {
    uuid: uuidv4(),
    user: null,
    values: []
  }

  watchCollection() {
    // Wrap inside a Promise because this loop never exits
    return new Promise(async () => {
      for await (const event of countersCollection.watch()) {
        if (event.operationType === 'insert' && event.fullDocument) {
          console.log('Received new counter', event.fullDocument.value)
          this.setState({
            values: [{ date: new Date(), counter: event.fullDocument.value }, ...this.state.values]
          })
        }
        if (event.operationType === 'update' && event.fullDocument) {
          console.log('Received counter update', event.fullDocument.value)
          this.setState({
            values: [{ date: new Date(), counter: event.fullDocument.value }, ...this.state.values]
          })
        }
        // // Stop at 250 (240 = 2 minutes)
        // if (this.state.values.length === 250) {
        //   clearInterval(this.interval)
        // }
      }
    })
  }

  componentDidMount() {
    const { uuid } = this.state
    const start = async () => {
      // Initiate login
      const user = await login()
      this.setState({ user })

      // Start watch on uuid
      this.watchCollection()

      // Start counter (update every 0.5 second)
      this.interval = setInterval(() => {
        const query = { uuid }
        const update = {
          $set: { uuid },
          $inc: { value: 0.5 }
        }
        const options = { upsert: true }
        console.log('Updating counter')
        countersCollection.updateOne(query, update, options)
      }, 500)
    }

    // Start login and counter
    start()
  }

  render() {
    const { uuid, user, values } = this.state

    if (!user) {
      return null
    }

    return (
      <div className="App">
        <header className="App-header">
          <p>Watch example using realm-web</p>
          <p>
            UUID: {uuid}
          </p>
          {values.map((value, index) => (
            <p key={index}>{value.date.toISOString()}: {value.counter}</p>
          ))}
        </header>
      </div>
    )
  }
}

export default App
