import Login from './components/Login';
import LandingPage from './Pages/LandingPage';
import BookingSummary from './Subpages/BookingSummary';
import { Routes, Route } from 'react-router-dom';
function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/booking-summary/:id" element={<BookingSummary />} />
    </Routes>
  );
}
export default App;
