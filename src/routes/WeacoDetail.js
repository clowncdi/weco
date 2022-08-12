import ItemsDetail from "components/ItemsDetail";
import { useLocation } from "react-router-dom";

const WeacoDetail = ({ userObj }) => {
  const location = useLocation();
  const id = location.pathname.split("/")[1];

  return (
    <section className="wrapContainer dark">
      <div className="container">
        <ItemsDetail userObj={userObj} itemId={id} />
      </div>
    </section>
  );
};

export default WeacoDetail;
