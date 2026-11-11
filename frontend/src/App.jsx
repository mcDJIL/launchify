import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<div className="p-10 text-xl">Halaman Login (WIP)</div>} />
          <Route path="/register" element={<div className="p-10 text-xl">Halaman Register (WIP)</div>} />

          {/* Protected Routes */}
          <Route path="/" element={<div className="p-10 text-xl">Dashboard User (WIP)</div>} />
          <Route path="/topup" element={<div className="p-10 text-xl">Top-Up QRIS (WIP)</div>} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<div className="p-10 text-xl">Admin Approval (WIP)</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;