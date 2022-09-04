import NewsFactory from "components/NewsFactory";
import NewsFactoryEdit from "components/NewsFactoryEdit";
import { useParams } from "react-router-dom";

const NewsWrite = ({ userObj }) => {
  let { id } = useParams();

  return (
    <section className="wrapContainer dark">
      <div className="container">
        {id ? (
          <>
            <h2>토픽 수정하기</h2>
            <NewsFactoryEdit userObj={userObj} itemId={id} />
          </>
        ) : (
          <>
            <h2>토픽 등록하기</h2>
            <NewsFactory userObj={userObj} />
          </>
        )}
      </div>
    </section>
  );
};

export default NewsWrite;
