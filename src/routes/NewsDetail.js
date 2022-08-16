import TopicDetail from "components/TopicDetail";
import { useParams } from "react-router-dom";

const NewsDetail = ({ userObj }) => {
  let { id } = useParams();

  return (
    <section className="wrapContainer dark">
      <div className="container">
        <TopicDetail userObj={userObj} itemId={id} />
      </div>
    </section>
  );
};

export default NewsDetail;
