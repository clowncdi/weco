import { HashRouter as Router, Route, Routes } from "react-router-dom";
import Auth from "routes/Auth";
import Home from "routes/Home";
import Write from "routes/Write";
import NewsWrite from "routes/NewsWrite";
import Navigation from "./Navigation";
import News from "routes/News";
import Infomation from "routes/Infomation";
import WeacoDetail from "./../routes/WeacoDetail";

function AppRouter({ refreshUser, isLoggedIn, userObj }) {
  return (
    <Router>
      {isLoggedIn ? (
        <Navigation userObj={userObj} isLoggedIn={isLoggedIn} />
      ) : (
        <Navigation isLoggedIn={isLoggedIn} />
      )}
      <Routes>
        {isLoggedIn ? (
          <>
            <Route path="/" element={<Home userObj={userObj} />}></Route>
            <Route
              path="/:id"
              element={<WeacoDetail userObj={userObj} />}
            ></Route>
            <Route path="/news" element={<News userObj={userObj} />}></Route>
          </>
        ) : (
          <>
            <Route path="/" element={<Home />}></Route>
            <Route path="/:id" element={<WeacoDetail />}></Route>
            <Route path="/news" element={<News userObj={userObj} />}></Route>
          </>
        )}
        <Route path="/login" element={<Auth isLoggedIn={isLoggedIn} />}></Route>
        <Route path="/info" element={<Infomation />}></Route>
        {isLoggedIn && (
          <>
            <Route path="/write" element={<Write userObj={userObj} />}></Route>
            <Route
              path="/write/:id"
              element={<Write userObj={userObj} />}
            ></Route>
            <Route
              path="/news/write"
              element={<NewsWrite userObj={userObj} />}
            ></Route>
            <Route
              path="/news/write/:id"
              element={<NewsWrite userObj={userObj} />}
            ></Route>
          </>
        )}
      </Routes>
    </Router>
  );
}

export default AppRouter;
