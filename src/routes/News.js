import { useEffect, useState } from "react";
import { dbService } from "fbase";
import NewsBrief from "components/NewsBrief";

const News = ({ userObj }) => {
  const [items, setItems] = useState([]);
  const [type, setType] = useState("");

  useEffect(() => {
    dbService
      .collection("news")
      .where("type", "==", `${type}`)
      .orderBy("createdAt", "desc")
      .onSnapshot((snapshot) => {
        const itemArray = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(itemArray);
      });
  }, [type]);

  useEffect(() => {
    dbService
      .collection("news")
      .orderBy("createdAt", "desc")
      .onSnapshot((snapshot) => {
        const itemArray = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(itemArray);
      });
  }, []);

  const onClickType = (event) => {
    const {
      target: { value },
    } = event;
    setType(value);
  };

  return (
    <div className="homeContainer dark newsGrid">
      <span className="news__noti">
        * 성격에 맞지 않은 글이나 도배 등 부적절한 이용은 관리자에 의해 제재를
        받을 수 있습니다.
      </span>
      <div className="news__type">
        {/* <label
          htmlFor="type-all"
          className={"commonBtn " + (type === "" ? "selected" : "")}
        >
          전체
        </label>
        <input id="type-all" type="button" value="all" onClick={onClickAll} /> */}
        <label
          htmlFor="type-news"
          className={"commonBtn " + (type === "News" ? "selected" : "")}
        >
          뉴스
        </label>
        <input
          id="type-news"
          type="button"
          value="News"
          onClick={onClickType}
        />
        <label
          htmlFor="type-bookmark"
          className={"commonBtn " + (type === "Bookmark" ? "selected" : "")}
        >
          북마크
        </label>
        <input
          id="type-bookmark"
          type="button"
          value="Bookmark"
          onClick={onClickType}
        />
        <label
          htmlFor="type-newsletter"
          className={"commonBtn " + (type === "Newsletter" ? "selected" : "")}
        >
          뉴스레터
        </label>
        <input
          id="type-newsletter"
          type="button"
          value="Newsletter"
          onClick={onClickType}
        />
        <label
          htmlFor="type-etc"
          className={"commonBtn " + (type === "Etc" ? "selected" : "")}
        >
          기타
        </label>
        <input id="type-etc" type="button" value="Etc" onClick={onClickType} />
      </div>
      {items.length > 0 ? (
        <article className="newsGridContainer">
          {userObj ? (
            <>
              {items.map((item) => (
                <NewsBrief
                  key={item.id}
                  itemObj={item}
                  isOwner={item.creatorId === userObj.uid}
                />
              ))}
            </>
          ) : (
            <>
              {items.map((item) => (
                <NewsBrief key={item.id} itemObj={item} isOwner={false} />
              ))}
            </>
          )}
        </article>
      ) : (
        <p className="news__empty">등록된 게시물이 없습니다.</p>
      )}
    </div>
  );
};

export default News;
