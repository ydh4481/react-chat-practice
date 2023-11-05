import { Route, Routes } from 'react-router-dom';
import Home from './Home';
import Chat from './Chat';

function App() {
  return (
    <div>
      <Routes>
        <Route exact path="/" element={<Home />}/>
        <Route exact path="/chat/:id" element={<Chat />}/>
      </Routes>
    </div>
  )
}

export default App;
