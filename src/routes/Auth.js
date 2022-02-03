import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AuthForm from "../components/AuthForm";
import { authService, firebaseInstance } from "../fbase";
import { faGoogle, faFacebook } from "@fortawesome/free-brands-svg-icons";

const Auth = () => {
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
    const data = await authService.signInWithPopup(provider);
    console.log(data);
  };

  return (
    <div className="authContainer">
      <AuthForm />
      <div className="authBtns">
        <button onClick={onSocialClick} name="google" className="authBtn">
          Google <FontAwesomeIcon icon={faGoogle} />
        </button>
        <button onClick={onSocialClick} name="facebook" className="authBtn">
          Facebook <FontAwesomeIcon icon={faFacebook} />
        </button>
      </div>
    </div>
  );
};

export default Auth;
