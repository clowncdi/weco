import { useEffect, useState } from "react";
import { dbService } from "fbase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import Item from "components/Item";
import Upbit from "components/Upbit";
import Indicator from "components/Indicator";
import Weather from "components/Weather";
import { Helmet } from "react-helmet-async";
import { Adsense } from "@ctrl/react-adsense";
import {
  adfitLong,
  adfitLong2,
  adfitMobile,
  adfitMobile2,
} from "components/ad";

const Home = ({ userObj }) => {
  let today = new Date();
  const offset = today.getTimezoneOffset();
  today = new Date(today.getTime() - offset * 60 * 1000);
  const defaultEndDate = today.toISOString().split("T")[0];
  const defaultStartDate = "2019-11-18";

  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [newTags, setNewTags] = useState([]);
  const [newDate, setNewDate] = useState("");
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [page, setPage] = useState(0);
  const [last, setLast] = useState({});
  const [more, setMore] = useState(true);
  const [text, setText] = useState("");

  const itemCount = 30;
  const skipedKeyword = [
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
    "경제뉴스",
    "미국증시",
    "뉴욕증시",
  ];

  useEffect(() => {
    dbService
      .collection("items")
      .where("creatorId", "==", process.env.REACT_APP_ADMIN)
      .orderBy("date", "desc")
      .limit(1)
      .onSnapshot((snapshot) => {
        if (snapshot.docs.length === 0) {
          return setText("");
        }
        const item = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const result = item.shift().text;
        setText(result);
      });
  }, []);

  useEffect(() => {
    const debounce = setTimeout(findAll(), 500);
    return () => clearTimeout(debounce);
  }, [keyword, startDate, endDate, page]);

  const findAll = () => {
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
      if (snapshot.docs.length === 0) {
        setMore(false);
        return setItems([]);
      }
      setNewTags(snapshot.docs[0].data().tags);
      setNewDate(snapshot.docs[0].data().date);
      const itemArray = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(itemArray);
      setLast(snapshot.docs[snapshot.docs.length - 1]);
      if (snapshot.docs.length < itemCount) setMore(false);
    });
  };

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

  useEffect(() => {
    adfitLong();
    adfitLong2();
    adfitMobile();
    adfitMobile2();
  }, []);

  return (
    <div className="homeContainer dark homeFlex">
      <Helmet>
        <title>{defaultEndDate} - 오늘의 날씨와 경제 - Weaco</title>
        <meta name="description" content={text} />
        <meta name="keywords" content={newTags} />
      </Helmet>
      <article className="indicatorContainer">
        {text && <Indicator text={text} />}
        <Upbit />
      </article>
      <article className="searchContainer__wrap">
        <div className="searchContainer">
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
                      !skipedKeyword.includes(tag) && (
                        <option value={tag} key={tag} />
                      )
                  )}
                </>
              )}
            </datalist>
          </div>
          <h3 className="keyword__title">{newDate} 이슈</h3>
          <ul className="keywordWrap">
            {newTags && (
              <>
                {newTags.map(
                  (tag) =>
                    !skipedKeyword.includes(tag) && (
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
        </div>
        <div className="weatherContainer">{text && <Weather />}</div>
      </article>
      <article>
        <div className="adfit adfit-l" style={{ marginTop: 15 }}></div>
        <div
          className="adfit adfit-m2"
          style={{
            marginTop: "3%",
            marginLeft: "3%",
            marginRight: "3%",
          }}
        ></div>
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
      <div>
        <div className="adfit adfit-l2"></div>
        <div className="adfit adfit-m"></div>
        <div className="googleAd">
          <Adsense
            client="ca-pub-6288876729056336"
            slot="4660559185"
            style={{ display: "block" }}
            format="auto"
            responsive="true"
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
