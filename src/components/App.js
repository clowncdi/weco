import AppRouter from "components/Router";
import { useState, useEffect } from "react";
import { authService } from "fbase";
import { Link } from "react-router-dom";

function App() {
  const [init, setInit] = useState(false);
  const [userObj, setUserObj] = useState(null);
  useEffect(() => {
    authService.onAuthStateChanged((user) => {
      if (user) {
        setUserObj({
          displayName: user.displayName,
          uid: user.uid,
          updateProfile: (args) => user.updateProfile(args),
        });
      } else {
        setUserObj(null);
      }
      setInit(true);
    });
  }, []);
  const refreshUser = () => {
    const user = authService.currentUser;
    setUserObj({
      displayName: user.displayName,
      uid: user.uid,
      updateProfile: (args) => user.updateProfile(args),
    });
  };

  return (
    <>
      {init ? (
        <AppRouter
          // refreshUser={refreshUser}
          isLoggedIn={Boolean(userObj)}
          userObj={userObj}
        />
      ) : (
        "Loading..."
      )}
      <footer className="appFooter dark">
        <p>&copy; {new Date().getFullYear()} weco</p>
        <address>
          Contact: <a href="mailto:insidebig@naver.com">insidebig@naver.com</a>
        </address>
        <a onClick={() => alert("준비중입니다")}>개인정보처리방침</a>
      </footer>
    </>
  );
}

export default App;
