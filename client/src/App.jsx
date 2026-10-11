import { Link, Navigate, Route, Routes } from 'react-router';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';

function App() {
  return (
    <>
      <nav aria-label="Main navigation">
        <Link to="/login">Login</Link>
        {' | '}
        <Link to="/signup">Signup</Link>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<h1>Page not found</h1>} />
        </Routes>
      </main>
    </>
  );
}

export default App;
