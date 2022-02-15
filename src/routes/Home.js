import { useEffect, useState } from "react";
import { dbService } from "fbase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSearch } from "@fortawesome/free-solid-svg-icons";
import Item from "components/Item";

const Home = ({ userObj }) => {
  let today = new Date();
  const offset = today.getTimezoneOffset();
  today = new Date(today.getTime() - offset * 60 * 1000);
  const defaultEndDate = today.toISOString().split("T")[0];
  // let monthAgo = new Date(today.setMonth(today.getMonth() - 12));
  // const defaultStartDate = monthAgo.toISOString().split("T")[0];
  const defaultStartDate = "2019-11-18";

  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [newTags, setNewTags] = useState([]);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [page, setPage] = useState(0);
  const [last, setLast] = useState({});
  const [more, setMore] = useState(true);

  const itemCount = 20;

  useEffect(() => {
    findAll();
  }, [keyword, startDate, endDate, page]);

  function findAll() {
    let result = [];
    if (keyword) {
      result = dbService
        .collection("items")
        .where("creatorId", "==", process.env.REACT_APP_ADMIN)
        .where("tags", "array-contains", keyword)
        .orderBy("date", "desc")
        .startAfter(last)
        .limit(itemCount);
    } else {
      result = dbService
        .collection("items")
        .where("creatorId", "==", process.env.REACT_APP_ADMIN)
        .where("date", ">=", startDate)
        .where("date", "<=", endDate)
        .orderBy("date", "desc")
        .startAfter(last)
        .limit(itemCount);
    }

    result.onSnapshot((snapshot) => {
      setNewTags(snapshot.docs[0].data().tags);
      const itemArray = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(itemArray);
      setLast(snapshot.docs[snapshot.docs.length - 1]);
      // if (snapshot.docs.length < itemCount) setMore(false);
    });
  }

  function init() {
    setPage(0);
    setLast({});
    setMore(true);
  }

  const onChangeKeyword = (event) => {
    const {
      target: { value },
    } = event;
    setKeyword(value);
    init();
  };

  // const onClickSearch = () => {
  //   init();
  //   setEndDate(defaultEndDate);
  //   console.log(123);
  // };

  // const onKeyPressSearch = (event) => {
  //   if (event.keyCode === 13) {
  //     init();
  //     setEndDate(defaultEndDate);
  //     findAll();
  //   }
  // };

  const onChangeStartDate = (event) => {
    const {
      target: { value },
    } = event;
    if (value > defaultEndDate) return alert("오늘까지만 선택 가능합니다.");
    setStartDate(value);
    init();
  };

  const onChangeEndDate = (event) => {
    const {
      target: { value },
    } = event;
    if (value > defaultEndDate) return alert("오늘까지만 선택 가능합니다.");
    setEndDate(value);
    init();
  };

  const onClickKeyword = (event) => {
    setKeyword(event.target.outerText);
    init();
  };

  const onClickSearchClear = () => {
    setKeyword("");
    init();
    setEndDate(defaultEndDate);
  };

  function onClickMore() {
    setPage(page + 1);
    window.scrollTo(0, 0);
  }

  return (
    <div className="homeContainer dark">
      <article className="searchContainer">
        <div className="searchInput__date">
          <input
            type="date"
            value={keyword ? "2019-11-18" : startDate}
            onChange={onChangeStartDate}
            disabled={keyword && true}
          />
          {keyword ? (
            "~ 현재까지"
          ) : (
            <>
              -
              <input
                type="date"
                value={keyword ? defaultEndDate : endDate}
                onChange={onChangeEndDate}
              />
            </>
          )}
        </div>
        <div className="searchInput__keyword">
          <span className="searchCancelBtn" onClick={onClickSearchClear}>
            <FontAwesomeIcon icon={faTimes} />
          </span>
          {/* <span className="searchBtn" onClick={onClickSearch}>
            <FontAwesomeIcon icon={faSearch} />
          </span> */}
          <input
            type="text"
            value={keyword}
            onChange={onChangeKeyword}
            // onKeyPress={onKeyPressSearch}
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
                      "주식",
                      "코인",
                    ].includes(tag) && <option value={tag} key={tag} />
                )}
              </>
            )}
          </datalist>
        </div>
        <h3 className="keyword__title">{endDate} 이슈</h3>
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
                    "주식",
                    "코인",
                  ].includes(tag) && (
                    <li
                      key={tag}
                      className="issueKeyword"
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
      {more && (
        <div className="moreBtnWrap">
          <span className="formBtn moreBtn" onClick={onClickMore}>
            다음
          </span>
        </div>
      )}
    </div>
  );
};

export default Home;
