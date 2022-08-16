import ItemsDetail from "components/ItemsDetail";
import { useParams } from "react-router-dom";

const WeacoDetail = ({ userObj }) => {
  let { id } = useParams();

  return (
    <section className="wrapContainer dark">
      <div className="container">
        <ItemsDetail userObj={userObj} itemId={id} />
      </div>
    </section>
  );
};

export default WeacoDetail;
