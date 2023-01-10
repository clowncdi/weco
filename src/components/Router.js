import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from "react-router-dom";

const Auth = lazy(() => import("routes/Auth"));
const Home = lazy(() => import("routes/Home"));
const Write = lazy(() => import("routes/Write"));
const NewsWrite = lazy(() => import("routes/NewsWrite"));
const Navigation = lazy(() => import("./Navigation"));
const News = lazy(() => import("routes/News"));
const Infomation = lazy(() => import("routes/Infomation"));
const WeacoDetail = lazy(() => import("routes/WeacoDetail"));
const NewsDetail = lazy(() => import("routes/NewsDetail"));
const ImageCompressior = lazy(() => import("routes/ImageCompressior"));

function AppRouter({ isLoggedIn, userObj }) {
  return (
    <>
      <Suspense fallback={<div className="loading"></div>}>
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
              {userObj.uid === process.env.REACT_APP_ADMIN && (
                <Route
                  path="/image-comp"
                  element={<ImageCompressior />}
                ></Route>
              )}
            </>
          )}
        </Routes>
      </Suspense>
    </>
  );
}

export default AppRouter;
