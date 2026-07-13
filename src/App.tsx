import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/home";
import Collections from "./pages/collections";
import BookDetail from "./pages/bookDetail";
import Discover from "./pages/discover";
import Community from "./pages/community";
import Login from "./pages/login";

export default function App() {
  return (
    <div>
      <nav style={{ display: "flex", gap: "1rem", padding: "1rem" }}>
        <Link to="/">Home</Link>
        <Link to="/collections">Collections</Link>
        <Link to="/discover">Discover</Link>
        <Link to="/community">Community</Link>
        <Link to="/login">Login</Link>
      </nav>

      <main style={{ padding: "1rem" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/community" element={<Community />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  );
}
