import AppRouter from "components/Router";
import { useState, useEffect } from "react";
import { authService } from "fbase";
import { useNavigate } from "react-router-dom";

function App() {
  const [init, setInit] = useState(false);
  const [userObj, setUserObj] = useState(null);
  useEffect(() => {
    authService.onAuthStateChanged((user) => {
      if (user) {
        setUserObj({
          displayName: user.displayName,
          email: user.email,
          uid: user.uid,
          updateProfile: (args) => user.updateProfile(args),
        });
      } else {
        setUserObj(null);
      }
      setInit(true);
    });
  }, []);

  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/info");
    window.scrollTo(0, 0);
  };

  return (
    <>
      {init ? (
        <AppRouter isLoggedIn={Boolean(userObj)} userObj={userObj} />
      ) : (
        <div className="loading">
          <img src={process.env.PUBLIC_URL + "/toolong.gif"} alt="loading..." />
        </div>
      )}
      <footer className="appFooter dark">
        <p>Copyright &copy; {new Date().getFullYear()} WEACO</p>
        <address>
          Contact: <a href="mailto:insidebig@naver.com">insidebig@naver.com</a>
        </address>
        <span className="privacy" onClick={handleClick}>
          개인정보처리방침
        </span>
        <a
          href="https://open.kakao.com/o/gQcRJPye"
          target="_blank"
          rel="noreferrer"
        >
          <span className="kakaochat">
            <img
              src="https://developers.kakao.com/assets/img/about/logos/kakaotalksharing/kakaotalk_sharing_btn_medium.png"
              width={"20px"}
              style={{ verticalAlign: "middle", marginRight: 10 }}
              alt={"카카오톡 공유"}
            />
            매일 아침 카카오톡 오픈채팅으로 받아보세요
          </span>
        </a>
      </footer>
    </>
  );
}

export default App;
