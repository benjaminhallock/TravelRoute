import { useState } from 'react'

import PhotoUpload from './components/PhotoUpload'
import TreesList from './components/TreesList.tsx'
import './App.css'

interface TreeData {
  id: string;
  photo: string;
  choice: 'A' | 'B' | 'C' | 'D';
  category: number;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  timestamp: Date;
}

function App() {
  const [count, setCount] = useState(0)
  const [activeTab, setActiveTab] = useState<'upload' | 'trees'>('upload')
  const [treeData, setTreeData] = useState<TreeData[]>([])

  const handleSaveTree = async (data: Omit<TreeData, 'id' | 'timestamp'>) => {
    const newTree: TreeData = {
      ...data,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    setTreeData(prev => [...prev, newTree])
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>📸TreeMap</h1>
        <p>Upload photos to extract location data and create reviews</p>

        <div className="tabs">
          <button
            className={activeTab === 'upload' ? 'active' : ''}
            onClick={() => setActiveTab('upload')}
          >
            Upload Photos
          </button>
          <button
            className={activeTab === 'trees' ? 'active' : ''}
            onClick={() => setActiveTab('trees')}
          >
            Trees ({treeData.length})
          </button>
        </div>
      </header>
      <main>
        {activeTab === 'upload' ? (
          <PhotoUpload onSave={handleSaveTree} />
        ) : (
          <TreesList trees={treeData} />
        )}
      </main>
    </div>
  )
}

export default App
