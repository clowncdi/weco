import ItemFactory from "components/ItemsFactory";

const Write = ({ userObj }) => {
  return (
    <div className="container">
      <h2>새 글 등록하기</h2>
      <ItemFactory userObj={userObj} />
    </div>
  );
};

export default Write;
