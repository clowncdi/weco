import { Link } from "react-router-dom";
import { authService } from "fbase";
import { useEffect } from 'react';
import { useState } from 'react';

const Navigation = ({ userObj, isLoggedIn }) => {
  const onLogOutClick = () => {
    authService.signOut();
  };

  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [lazyPoint, setLazyPoint] = useState(0);
  const nav = document.querySelector(".nav");
  
  useEffect(() => {
    setPrevScrollPos(window.pageYOffset);
    setLazyPoint(0);
  }, []);
  
  window.onscroll = function () {
    let currentScrollPos = window.pageYOffset;
    if (prevScrollPos > currentScrollPos || currentScrollPos < 50) {
      setLazyPoint(lazyPoint + (prevScrollPos - currentScrollPos));
      if (lazyPoint > 30) {
        nav.style.top = "0";     
      }
    } else {
      setLazyPoint(0);
      nav.style.top = "-100px";
    }
    setPrevScrollPos(currentScrollPos);
  };

  return (
    <nav className="nav">
      <div className="brand">
        <Link to="/">
          <img src={process.env.PUBLIC_URL + "/logo2.png"} alt="logo" loading="lazy" />
          오늘의 날씨와 경제
        </Link>
      </div>
      <ul>
        <li>
          <Link to="/">
            <span className="commonBtn formBtn homeBtn">홈</span>
          </Link>
        </li>
        <li>
          <Link to="/news">
            <span className="commonBtn formBtn homeBtn">토픽</span>
          </Link>
        </li>
        {isLoggedIn ? (
          <>
            {userObj.uid === process.env.REACT_APP_ADMIN && (
              <li>
                <Link to="/write">
                  <span className="commonBtn formBtn writeBtn"></span>
                </Link>
              </li>
            )}
            <li>
              <Link to="/news/write">
                <span className="commonBtn formBtn writeBtn">글쓰기</span>
              </Link>
            </li>
            <li>
              <Link to="/">
                <span
                  className="commonBtn formBtn cancelBtn logOut"
                  onClick={onLogOutClick}
                >
                  로그아웃
                </span>
              </Link>
            </li>
          </>
        ) : (
          <li>
            <Link to="/login">
              <span className="commonBtn formBtn">로그인</span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navigation;
