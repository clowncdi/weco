import NewsFactory from "components/NewsFactory";
import NewsFactoryEdit from "components/NewsFactoryEdit";
import { useLocation } from "react-router-dom";

const NewsWrite = ({ userObj }) => {
  const location = useLocation();
  const id = location.pathname.split("/write/")[1];

  return (
    <section className="wrapContainer dark">
      <div className="container">
        {id ? (
          <>
            <h2>글 수정하기</h2>
            <NewsFactoryEdit userObj={userObj} itemId={id} />
          </>
        ) : (
          <>
            <h2>글 등록하기</h2>
            <NewsFactory userObj={userObj} />
          </>
        )}
      </div>
    </section>
  );
};

export default NewsWrite;
