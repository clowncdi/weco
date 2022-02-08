import { Link } from "react-router-dom";
import { authService } from "fbase";

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
          <Link to="/">
            <span className="commonBtn formBtn homeBtn">홈</span>
          </Link>
        </li>
        <li>
          <Link to="/news">
            <span className="commonBtn formBtn homeBtn">새글</span>
          </Link>
        </li>
        {isLoggedIn ? (
          <>
            {userObj.uid === "Vf46gZOvLVagkCQbvZxSqXyjrDu1" && (
              <li>
                <Link to="/write">
                  <span className="commonBtn formBtn writeBtn">V</span>
                </Link>
              </li>
            )}
            <li>
              <Link to="/news/write">
                <span className="commonBtn formBtn writeBtn">등록</span>
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
