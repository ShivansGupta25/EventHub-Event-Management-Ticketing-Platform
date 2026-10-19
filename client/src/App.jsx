import { Route, Routes } from 'react-router';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';

function Placeholder({ name }) {
  return <h1 className="p-8 text-2xl font-bold">{name} (coming soon)</h1>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/profile" element={<Placeholder name="Profile" />} />
      <Route path="/admin" element={<Placeholder name="Admin" />} />
      <Route path="/admin/users" element={<Placeholder name="Admin users" />} />
      <Route
        path="/admin/events"
        element={<Placeholder name="Admin events" />}
      />
      <Route
        path="/admin/payment-issues"
        element={<Placeholder name="Payment issues" />}
      />

      <Route path="/events" element={<Placeholder name="Events" />} />
      <Route
        path="/events/:eventId"
        element={<Placeholder name="Event details" />}
      />
      <Route
        path="/organizer"
        element={<Placeholder name="Organizer dashboard" />}
      />
      <Route
        path="/organizer/events/new"
        element={<Placeholder name="New event" />}
      />
      <Route
        path="/organizer/events/:eventId"
        element={<Placeholder name="Manage event" />}
      />
      <Route
        path="/organizer/events/:eventId/edit"
        element={<Placeholder name="Edit event" />}
      />
      <Route
        path="/organizer/events/:eventId/attendees"
        element={<Placeholder name="Attendees and check-in" />}
      />

      <Route path="/my-bookings" element={<Placeholder name="My bookings" />} />
      <Route
        path="/bookings/:bookingId"
        element={<Placeholder name="Booking" />}
      />
      <Route
        path="/bookings/:bookingId/ticket"
        element={<Placeholder name="Ticket" />}
      />
      <Route
        path="/checkout/return"
        element={<Placeholder name="Checkout return" />}
      />

      <Route path="*" element={<Placeholder name="Page not found" />} />
    </Routes>
  );
}

export default App;
