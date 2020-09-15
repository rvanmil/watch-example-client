import React, { useEffect, useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { login, countersCollection } from './realm'

import logo from './logo.svg'
import './App.css'

let interval

function App() {
  const [user, setUser] = useState(null)
  const [uuid] = useState(uuidv4())
  const [isSending, setIsSending] = useState(false)
  const [values, setValues] = useState([])

  const addValueToValues = useCallback((value) => {
    values.push(value)
    setValues([...values].reverse())

    // Stop at 250 (240 = 2 minutes)
    if (values.length === 250) {
      clearInterval(interval)
    }
  }, [values])

  useEffect(() => {
    const performLogin = async () => {
      const user = await login()
      setUser(user)
    }

    performLogin()
  }, [])

  useEffect(() => {
    const performStart = async () => {
      if (!isSending) {
        setIsSending(true)

        // Start watch on uuid
        const stream = await countersCollection.watch({ 'fullDocument.uuid': uuid })
        stream.onNext((event) => {
          if (event.operationType === 'insert' && event.fullDocument) {
            addValueToValues({ date: new Date(), counter: event.fullDocument.value })
          }
          if (event.operationType === 'update' && event.fullDocument) {
            addValueToValues({ date: new Date(), counter: event.fullDocument.value })
          }
        })

        // Start counter (update every 0.5 second)
        interval = setInterval(() => {
          const query = { uuid }
          const update = {
            $set: { uuid },
            $inc: { value: 0.5 }
          }
          const options = { upsert: true }
          countersCollection.updateOne(query, update, options)
        }, 500)
      }
    }

    performStart()
  }, [uuid, isSending, addValueToValues])

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

export default App
