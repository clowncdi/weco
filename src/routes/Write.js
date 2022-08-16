import ItemFactory from "components/ItemsFactory";
import ItemFactoryEdit from "components/ItemsFactoryEdit";
import { useParams } from "react-router-dom";

const Write = ({ userObj }) => {
  let { id } = useParams();

  return (
    <section className="wrapContainer dark">
      <div className="container">
        {id ? (
          <>
            <h2>글 수정하기</h2>
            <ItemFactoryEdit userObj={userObj} itemId={id} />
          </>
        ) : (
          <>
            <h2>새 글 등록하기</h2>
            <ItemFactory userObj={userObj} />
          </>
        )}
      </div>
    </section>
  );
};

export default Write;
