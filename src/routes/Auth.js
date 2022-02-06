import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AuthForm from "components/AuthForm";
import { authService, firebaseInstance } from "fbase";
import { faGoogle, faFacebook } from "@fortawesome/free-brands-svg-icons";
import { useNavigate } from "react-router-dom";

const Auth = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  if (isLoggedIn) {
    navigate("/");
  }
  const onSocialClick = async (event) => {
    const {
      target: { name },
    } = event;
    let provider;
    if (name === "google") {
      provider = new firebaseInstance.auth.GoogleAuthProvider();
    } else if (name === "facebook") {
      provider = new firebaseInstance.auth.FacebookAuthProvider();
    }
    await authService.signInWithPopup(provider);
  };

  return (
    <section className="wrapContainer dark">
      <div className="authContainer dark">
        <AuthForm />
        <div className="authBtns">
          <button
            onClick={onSocialClick}
            name="google"
            className="commonBtn authBtn"
          >
            Google <FontAwesomeIcon icon={faGoogle} />
          </button>
          <button
            onClick={onSocialClick}
            name="facebook"
            className="commonBtn authBtn"
          >
            Facebook <FontAwesomeIcon icon={faFacebook} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Auth;
