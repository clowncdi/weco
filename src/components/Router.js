import { HashRouter as Router, Route, Routes } from "react-router-dom";
import Auth from "routes/Auth";
import Home from "routes/Home";
import Write from "routes/Write";
import Navigation from "./Navigation";

function AppRouter({ refreshUser, isLoggedIn, userObj }) {
  return (
    <Router>
      <Navigation userObj={userObj} isLoggedIn={isLoggedIn} />
      <Routes>
        <Route path="/" element={<Home userObj={userObj} />}></Route>
        <Route path="/login" element={<Auth />}></Route>
        {isLoggedIn && (
          <Route path="/write" element={<Write userObj={userObj} />}></Route>
        )}
      </Routes>
    </Router>
  );
}

export default AppRouter;
