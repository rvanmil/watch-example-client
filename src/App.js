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

  componentDidMount() {
    const { uuid } = this.state
    const start = async () => {
      // Initiate login
      const user = await login()
      this.setState({ user })

      // Start watch on uuid
      const stream = await countersCollection.watch({ 'fullDocument.uuid': uuid })
      stream.onNext((event) => {
        if (event.operationType === 'insert' && event.fullDocument) {
          this.setState({
            values: [{ date: new Date(), counter: event.fullDocument.value }, ...this.state.values]
          })
        }
        if (event.operationType === 'update' && event.fullDocument) {
          this.setState({
            values: [{ date: new Date(), counter: event.fullDocument.value }, ...this.state.values]
          })
        }

        // Stop at 250 (240 = 2 minutes)
        if (this.state.values.length === 250) {
          clearInterval(this.interval)
        }
      })

      // Start counter (update every 0.5 second)
      this.interval = setInterval(() => {
        const query = { uuid }
        const update = {
          $set: { uuid },
          $inc: { value: 0.5 }
        }
        const options = { upsert: true }
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
