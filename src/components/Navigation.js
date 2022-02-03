import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { authService } from "fbase";

const Navigation = ({ userObj, isLoggedIn }) => {
  const navigate = useNavigate();
  const onLogOutClick = () => {
    authService.signOut();
    navigate("/login");
  };

  return (
    <nav style={{ textAlign: "center" }}>
      <ul style={{ display: "flex", justifyContent: "center", marginTop: 30 }}>
        <li>
          <Link to="/">
            <span className="formBtn homeBtn">Home</span>
          </Link>
        </li>
        {isLoggedIn ? (
          <>
            <li>
              <Link to="/write">
                <span className="formBtn writeBtn">Write</span>
              </Link>
            </li>
            <li>
              <Link to="/logout">
                <span
                  className="formBtn cancelBtn logOut"
                  onClick={onLogOutClick}
                >
                  Logout
                </span>
              </Link>
            </li>
          </>
        ) : (
          <li>
            <Link to="/login">
              <span className="formBtn">Login</span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navigation;
