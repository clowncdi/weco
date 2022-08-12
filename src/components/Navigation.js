import { Link } from "react-router-dom";
import { authService } from "fbase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faUserSlash,
  faHighlighter,
} from "@fortawesome/free-solid-svg-icons";

const Navigation = ({ userObj, isLoggedIn }) => {
  const onLogOutClick = () => {
    authService.signOut();
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
                <span className="commonBtn formBtn writeBtn">
                  <FontAwesomeIcon icon={faHighlighter} />
                </span>
              </Link>
            </li>
            <li>
              <Link to="/">
                <span
                  className="commonBtn formBtn cancelBtn logOut"
                  onClick={onLogOutClick}
                >
                  <FontAwesomeIcon icon={faUserSlash} />
                </span>
              </Link>
            </li>
          </>
        ) : (
          <li>
            <Link to="/login">
              <span className="commonBtn formBtn">
                <FontAwesomeIcon icon={faUser} />
              </span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navigation;
