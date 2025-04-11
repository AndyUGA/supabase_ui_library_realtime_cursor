import { useState } from 'react';
import { RealtimeCursors } from './components/realtime-cursors';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className='w-full min-h-screen'>
        <RealtimeCursors
          roomName='macrodata_refinement_office'
          username='Mark Scout'
        />
      </div>
    </>
  );
}

export default App;
