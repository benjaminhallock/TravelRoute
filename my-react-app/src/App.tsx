import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import PhotoUpload from './components/PhotoUpload'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <header className="App-header">
        <h1>📸 Photo Geotagging & Review App</h1>
        <p>Upload photos to extract location data and create reviews</p>
      </header>
      <main>
        <PhotoUpload />
      </main>
    </div>
  )
}

export default App
