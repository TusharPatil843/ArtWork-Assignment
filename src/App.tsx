import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ArtTable from './components/artTable'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="App">
      <ArtTable />
    </div>
    </>
  )
}

export default App
