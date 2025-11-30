import { Link } from "react-router-dom";
import { authService } from "fbase";
import { useEffect, useRef } from 'react';

const Navigation = ({ userObj, isLoggedIn }) => {
  const onLogOutClick = () => {
    authService.signOut();
  };

  const navRef = useRef(null);
  const prevScrollPosRef = useRef(0);
  const lazyPointRef = useRef(0);

  useEffect(() => {
    prevScrollPosRef.current = window.pageYOffset;
    lazyPointRef.current = 0;

    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;
      const prevScrollPos = prevScrollPosRef.current;
      const lazyPoint = lazyPointRef.current;
      const nav = navRef.current;

      if (!nav) return;

      if (prevScrollPos > currentScrollPos || currentScrollPos < 50) {
        // Scrolling UP or near top
        const newLazyPoint = lazyPoint + (prevScrollPos - currentScrollPos);
        lazyPointRef.current = newLazyPoint;

        if (newLazyPoint > 30) {
          nav.style.transform = "translateY(0)";
        }
      } else {
        // Scrolling DOWN
        lazyPointRef.current = 0;
        nav.style.transform = "translateY(-100px)";
      }

      prevScrollPosRef.current = currentScrollPos;
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav className="nav" ref={navRef}>
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
                <Link to="/write" aria-label="관리자 글쓰기">
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
              <button
                className="commonBtn formBtn cancelBtn logOut"
                onClick={onLogOutClick}
                type="button"
              >
                로그아웃
              </button>
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
