import { Link } from "react-router-dom";
import { authService } from "fbase";

const Navigation = ({ userObj, isLoggedIn }) => {
  const onLogOutClick = () => {
    authService.signOut();
  };

  const nav = document.querySelector(".nav");
  let prevScrollpos = window.pageYOffset;
  window.onscroll = function () {
    let currentScrollPos = window.pageYOffset;
    if (prevScrollpos > currentScrollPos) {
      nav.style.top = "0";
    } else {
      nav.style.top = "-100px";
    }
    prevScrollpos = currentScrollPos;
  };

  return (
    <nav className="nav">
      <div className="brand">
        <Link to="/">
          <img src={process.env.PUBLIC_URL + "/logo2.png"} alt="logo" />
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
