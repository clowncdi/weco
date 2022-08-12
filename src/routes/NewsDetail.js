import TopicDetail from "components/TopicDetail";
import { useLocation } from "react-router-dom";

const NewsDetail = ({ userObj }) => {
  const location = useLocation();
  const id = location.pathname.split("/")[2];

  return (
    <section className="wrapContainer dark">
      <div className="container">
        <TopicDetail userObj={userObj} itemId={id} />
      </div>
    </section>
  );
};

export default NewsDetail;
