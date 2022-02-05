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
          <img src={process.env.PUBLIC_URL + "/logo_icon.png"} alt="logo" />
          오늘의 날씨와 경제
        </Link>
      </div>
      <ul>
        <li>
          <Link to="/town">
            <span className="formBtn homeBtn">우리동네 둘러보기</span>
          </Link>
        </li>
        {isLoggedIn ? (
          <>
            <li>
              <Link to="/write">
                <span className="formBtn writeBtn">등록</span>
              </Link>
            </li>
            <li>
              <Link to="/">
                <span
                  className="formBtn cancelBtn logOut"
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
              <span className="formBtn">로그인</span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navigation;
