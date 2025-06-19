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

interface TreesListProps {
  trees: TreeData[];
}

const TreesList: React.FC<TreesListProps> = ({ trees }) => {
  if (trees.length === 0) {
    return (
      <div className="trees-list empty">
        <h2>No Trees Saved Yet</h2>
        <p>Upload photos and save tree data to see them here.</p>
      </div>
    )
  }

  return (
    <div className="trees-list">
      <h2>Saved Trees ({trees.length})</h2>
      <div className="trees-grid">
        {trees.map(tree => (
          <div key={tree.id} className="tree-card">
            <img 
              src={tree.photo} 
              alt={`Tree ${tree.id}`}
              style={{ width: '200px', height: '200px', objectFit: 'cover' }}
            />
            <div className="tree-info">
              <p><strong>Grade:</strong> {tree.choice}</p>
              <p><strong>Category:</strong> {tree.category}</p>
              <p><strong>Address:</strong> {tree.address}</p>
              <p><strong>Coordinates:</strong> {tree.location.lat.toFixed(6)}, {tree.location.lng.toFixed(6)}</p>
              <p><strong>Saved:</strong> {tree.timestamp.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TreesList
