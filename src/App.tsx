import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/home";
import Collections from "./pages/collections";
import CollectionDetail from "./pages/collectionDetail";
import BookDetail from "./pages/bookDetail";
import Discover from "./pages/discover";
import Community from "./pages/community";
import Login from "./pages/login";
import NotFound from "./pages/notFound";
import { useAuth } from "./hooks/useAuth";
import { supabase } from "./lib/supabase";

export default function App() {
  const { user } = useAuth();

  return (
    <div>
      <nav className="site-nav">
        {/* The wordmark is the home link, so a separate "Home" item would be
            redundant — and the nav already wraps to two lines on a phone. */}
        <Link className="brand" to="/" aria-label="Nightstand — home">
          <span className="brand-mark" aria-hidden="true" />
          Nightstand
        </Link>
        <Link to="/collections">Collections</Link>
        <Link to="/discover">Discover</Link>
        <Link to="/community">Community</Link>
        {user ? (
          <button className="nav-end" onClick={() => supabase.auth.signOut()}>Log Out</button>
        ) : (
          <Link className="nav-end" to="/login">Login</Link>
        )}
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/:id" element={<CollectionDetail />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/community" element={<Community />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
