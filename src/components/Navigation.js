import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { authService } from "fbase";
import { faCloudMoon, faSun } from "@fortawesome/free-solid-svg-icons";

const Navigation = ({ userObj, isLoggedIn }) => {
  const onLogOutClick = () => {
    authService.signOut();
  };

  return (
    <nav>
      <div className="brand">
        <Link to="/">
          <img src={process.env.PUBLIC_URL + "/logo512.png"} alt="logo" />
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
            <span className="commonBtn formBtn homeBtn">뉴스</span>
          </Link>
        </li>
        {isLoggedIn ? (
          <>
            <li>
              <Link to="/write">
                <span className="commonBtn formBtn writeBtn">사진등록</span>
              </Link>
            </li>
            <li>
              <Link to="/news/write">
                <span className="commonBtn formBtn writeBtn">뉴스등록</span>
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
