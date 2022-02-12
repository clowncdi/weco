import { useEffect, useState } from "react";
import { dbService } from "fbase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import Item from "components/Item";

const Home = ({ userObj }) => {
  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [newTags, setNewTags] = useState([]);

  useEffect(() => {
    keyword ? findAllKeyword() : findAll();
  }, [keyword]);

  function findAll() {
    dbService
      .collection("items")
      .where("creatorId", "==", process.env.REACT_APP_ADMIN)
      .orderBy("date", "desc")
      .onSnapshot((snapshot) => {
        setNewTags(snapshot.docs[0].data().tags);
        const itemArray = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(itemArray);
      });
  }

  function findAllKeyword() {
    const result = dbService
      .collection("items")
      .where("creatorId", "==", process.env.REACT_APP_ADMIN)
      .where("tags", "array-contains", keyword)
      .orderBy("date", "desc");

    if (result !== "") {
      result.onSnapshot((snapshot) => {
        const itemArray = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(itemArray);
      });
    }
  }

  const onChangeKeyword = (event) => {
    const {
      target: { value },
    } = event;
    setKeyword(value);
  };

  const onClickKeyword = (event) => {
    setKeyword(event.target.outerText);
  };

  const onClickSearchClear = () => {
    setKeyword("");
  };

  return (
    <div className="homeContainer dark">
      <article className="searchContainer">
        <div className="searchInputWrap">
          <span className="searchCancelBtn" onClick={onClickSearchClear}>
            <FontAwesomeIcon icon={faTimes} />
          </span>
          <input
            type="text"
            value={keyword}
            onChange={onChangeKeyword}
            placeholder="키워드 검색"
            list="keyword-options"
          />
          <datalist id="keyword-options">
            {newTags && (
              <>
                {newTags.map(
                  (tag) =>
                    ![
                      "오늘의날씨",
                      "오늘의경제",
                      "날씨",
                      "경제",
                      "뉴스",
                      "오늘날씨",
                      "서울날씨",
                      "시황",
                    ].includes(tag) && <option value={tag} key={tag} />
                )}
              </>
            )}
          </datalist>
        </div>
        <h3 className="keyword__title">
          {items.length > 0 && items[0].date} 오늘의 키워드
        </h3>
        <ul className="keywordWrap">
          {newTags && (
            <>
              {newTags.map(
                (tag) =>
                  ![
                    "오늘의날씨",
                    "오늘의경제",
                    "날씨",
                    "경제",
                    "뉴스",
                    "오늘날씨",
                    "서울날씨",
                    "시황",
                  ].includes(tag) && (
                    <li
                      key={tag}
                      className="formBtn commonBtn"
                      onClick={onClickKeyword}
                    >
                      {tag}
                    </li>
                  )
              )}
            </>
          )}
        </ul>
      </article>
      <article className="itemGridContainer">
        {userObj ? (
          <>
            {items.map((item) => (
              <Item
                key={item.id}
                itemObj={item}
                isOwner={item.creatorId === userObj.uid}
              />
            ))}
          </>
        ) : (
          <>
            {items.map((item) => (
              <Item key={item.id} itemObj={item} isOwner={false} />
            ))}
          </>
        )}
        {items.length === 0 && (
          <p className="news__empty item__empty">등록된 게시물이 없습니다.</p>
        )}
      </article>
    </div>
  );
};

export default Home;
