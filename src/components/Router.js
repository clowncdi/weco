import { Navigate, Route, Routes } from "react-router-dom";
import Auth from "routes/Auth";
import Home from "routes/Home";
import Write from "routes/Write";
import NewsWrite from "routes/NewsWrite";
import Navigation from "./Navigation";
import News from "routes/News";
import Infomation from "routes/Infomation";
import WeacoDetail from "routes/WeacoDetail";
import NewsDetail from "routes/NewsDetail";

function AppRouter({ isLoggedIn, userObj }) {
  return (
    <>
      {isLoggedIn ? (
        <Navigation userObj={userObj} isLoggedIn={isLoggedIn} />
      ) : (
        <Navigation isLoggedIn={isLoggedIn} />
      )}
      <Routes>
        <Route exact path="/" element={<Home userObj={userObj} />}></Route>
        <Route path="/:id" element={<WeacoDetail userObj={userObj} />}></Route>
        <Route path="/news" element={<News userObj={userObj} />}></Route>
        <Route
          path="/news/:id"
          element={<NewsDetail userObj={userObj} />}
        ></Route>
        <Route path="/login" element={<Auth isLoggedIn={isLoggedIn} />}></Route>
        <Route path="/info" element={<Infomation />}></Route>
        <Route path="*" element={<Navigate replace to={"/"} />}></Route>
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
    </>
  );
}

export default AppRouter;
