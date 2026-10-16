import React from 'react';
import GestureTree from './components/GestureTree';

const App: React.FC = () => {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black text-white">
      <GestureTree />
    </div>
  );
};

export default App;