import { useEffect, useState, useRef, useCallback } from "react";
import { dbService } from "fbase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import Item from "components/Item";
import Upbit from "components/Upbit";
import Indicator from "components/Indicator";
import Weather from "components/Weather";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import {
  adfitLong2,
  adfitMobile,
  adfitMobile2,
} from "components/ad";

const Home = ({ userObj }) => {
  const location = useLocation();
  const tagged = location.state?.tagged;

  // Date calculation helper
  const getFormattedDate = (date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split("T")[0];
  };

  const today = new Date();
  const defaultEndDate = getFormattedDate(today);

  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const defaultStartDate = getFormattedDate(oneMonthAgo);

  const [items, setItems] = useState([]);
  const [items2, setItems2] = useState([]);
  const [items3, setItems3] = useState([]);
  const [keyword, setKeyword] = useState(tagged || "");
  const [newTags, setNewTags] = useState([]);
  const [newDate, setNewDate] = useState("");
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [page, setPage] = useState(0);
  const [last, setLast] = useState({});
  const [last2, setLast2] = useState({});
  const [last3, setLast3] = useState({});
  const [more, setMore] = useState(true);
  const [text, setText] = useState("");

  const unsubscribes = useRef([]);

  const itemCount = 6;
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

  // Fetch initial text (one-time)
  useEffect(() => {
    const unsubscribe = dbService
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
      }, (error) => {
        console.error("Error fetching initial text:", error);
      });

    return () => unsubscribe();
  }, []);

  const findAll = useCallback(async () => {
    // Clear previous subscriptions
    unsubscribes.current.forEach((unsub) => unsub && unsub());
    unsubscribes.current = [];

    let query1, query2, query3;

    const endYear = Number(endDate.substring(0, 4));
    const startYear = Number(startDate.substring(0, 4));

    const lastEndYear = endYear - 1;
    const lastStartYear = startYear - 1;
    const lastYearStartDate = lastStartYear + startDate.substring(4);
    const lastYearEndDate = lastEndYear + endDate.substring(4);

    const beforeLastEndYear = lastEndYear - 1;
    const beforeLastStartYear = lastStartYear - 1;
    const beforeLastYearStartDate = beforeLastStartYear + startDate.substring(4);
    const beforeLastYearEndDate = beforeLastEndYear + endDate.substring(4);

    if (keyword) {
      setItems2([]);
      query1 = dbService
        .collection("items")
        .where("creatorId", "==", process.env.REACT_APP_ADMIN)
        .where("tags", "array-contains", keyword)
        .orderBy("date", "desc")
        .startAfter(last)
        .limit(itemCount);

    } else {
      query1 = dbService
        .collection("items")
        .where("creatorId", "==", process.env.REACT_APP_ADMIN)
        .where("date", ">=", startDate)
        .where("date", "<=", endDate)
        .orderBy("date", "desc")
        .startAfter(last)
        .limit(itemCount);

      query2 = dbService
        .collection("items")
        .where("creatorId", "==", process.env.REACT_APP_ADMIN)
        .where("date", ">=", lastYearStartDate)
        .where("date", "<=", lastYearEndDate)
        .orderBy("date", "desc")
        .startAfter(last2)
        .limit(itemCount);

      query3 = dbService
        .collection("items")
        .where("creatorId", "==", process.env.REACT_APP_ADMIN)
        .where("date", ">=", beforeLastYearStartDate)
        .where("date", "<=", beforeLastYearEndDate)
        .orderBy("date", "desc")
        .startAfter(last3)
        .limit(itemCount);
    }

    if (query1) {
      const unsub1 = query1.onSnapshot((snapshot) => {
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
      }, (error) => {
        console.error("Error fetching items (query1):", error);
      });
      unsubscribes.current.push(unsub1);
    }

    if (query2) {
      const unsub2 = query2.onSnapshot((snapshot) => {
        if (snapshot.docs.length === 0) {
          setMore(false);
          return setItems2([]);
        }
        const itemArray = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems2(itemArray);
        setLast2(snapshot.docs[snapshot.docs.length - 1]);
        if (snapshot.docs.length < itemCount) setMore(false);
      }, (error) => {
        console.error("Error fetching items (query2):", error);
      });
      unsubscribes.current.push(unsub2);
    }

    if (query3) {
      const unsub3 = query3.onSnapshot((snapshot) => {
        if (snapshot.docs.length === 0) {
          setMore(false);
          return setItems3([]);
        }
        const itemArray = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems3(itemArray);
        setLast3(snapshot.docs[snapshot.docs.length - 1]);
        if (snapshot.docs.length < itemCount) setMore(false);
      }, (error) => {
        console.error("Error fetching items (query3):", error);
      });
      unsubscribes.current.push(unsub3);
    }
  }, [keyword, startDate, endDate, last, last2, last3]); // Dependencies for query construction

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      findAll();
    }, 500);

    return () => {
      clearTimeout(timer);
      // Cleanup subscriptions on unmount or re-run
      unsubscribes.current.forEach((unsub) => unsub && unsub());
      unsubscribes.current = [];
    };
  }, [keyword, startDate, endDate, page, findAll]); // Only trigger on these changes

  function init() {
    setPage(0);
    setLast({});
    setLast2({});
    setLast3({});
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
    setKeyword(event.target.innerText); // outerText -> innerText for better cross-browser support
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
    adfitLong2();
    adfitMobile();
    adfitMobile2();
  }, []);

  return (
    <div className="homeContainer dark homeFlex">
      <Helmet>
        <title>오늘의 날씨와 경제 - Weaco</title>
        <meta name="description" content="간단한 날씨 정보와 경제 소식을 알려드립니다." />
        <meta
          name="keywords"
          content="날씨,경제,오늘의날씨,오늘의경제,뉴스,오늘날씨,서울날씨,시황,경제뉴스,토픽,이슈,경제소식,경제이슈"
        />
        <meta name="author" content="weaco" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="오늘의 날씨와 경제 - Weaco" />
        <meta property="og:title" content="오늘의 날씨와 경제 - Weaco" />
        <meta property="og:description" content="간단한 날씨 정보와 경제 소식을 알려드립니다." />
        <meta property="og:image" content={process.env.PUBLIC_URL + "/logo2.png"} />
        <meta property="og:url" content="https://weaco.co.kr/" />
        <meta property="twitter:card" content="summary" />
        <meta property="twitter:site" content="오늘의 날씨와 경제 - Weaco" />
        <meta property="twitter:title" content="오늘의 날씨와 경제 - Weaco" />
        <meta property="twitter:description" content="간단한 날씨 정보와 경제 소식을 알려드립니다." />
        <meta property="twitter:image" content={process.env.PUBLIC_URL + "/logo2.png"} />
        <meta property="twitter:url" content="https://weaco.co.kr/" />
      </Helmet>
      <div className="indicator-wrap">
        <div className="indicator-arrow prev">{'<'}</div>
        <div className="indicator-arrow next">{'>'}</div>
        <article className="indicatorContainer">
          {text && <Indicator text={text} />}
          <Upbit />
        </article>
      </div>
      <article className="searchContainer__wrap">
        <div className="searchContainer">
          <div className="searchInput__date">
            <label htmlFor="startDate" className="sr-only">시작 날짜</label>
            <input
              id="startDate"
              type="date"
              value={keyword ? "2019-11-18" : startDate}
              onChange={onChangeStartDate}
              disabled={!!keyword}
            />
            {keyword ? (
              "~ 현재까지"
            ) : (
              <>
                -
                <label htmlFor="endDate" className="sr-only">종료 날짜</label>
                <input
                  id="endDate"
                  type="date"
                  value={keyword ? defaultEndDate : endDate}
                  onChange={onChangeEndDate}
                />
              </>
            )}
          </div>
          <div className="searchInput__keyword">
            <button
              className="searchCancelBtn"
              onClick={onClickSearchClear}
              aria-label="검색어 초기화"
              type="button"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <label htmlFor="keywordSearch" className="sr-only">키워드 검색</label>
            <input
              id="keywordSearch"
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
                      <li key={tag}>
                        <button
                          className="issueKeyword"
                          onClick={onClickKeyword}
                          type="button"
                        >
                          {tag}
                        </button>
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
        <div
          className="adfit adfit-m2"
          style={{
            marginTop: "3%",
            marginLeft: "3%",
            marginRight: "3%",
          }}
        ></div>
      </article>
      <h2 className="itemTitle">{keyword || endDate.substring(0, 4)}</h2>
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
          <p className="news__empty item__empty">
            <i>{keyword}</i>에 대한 게시물이 없습니다.
          </p>
        )}
      </article>
      {!keyword && (
        <>
          <h2 className="itemTitle">{Number(endDate.substring(0, 4)) - 1}</h2>
          <article className="itemGridContainer">
            {userObj ? (
              <>
                {items2.map((item) => (
                  <Item
                    key={item.id}
                    itemObj={item}
                    isOwner={item.creatorId === userObj.uid}
                  />
                ))}
              </>
            ) : (
              <>
                {items2.map((item) => (
                  <Item key={item.id} itemObj={item} isOwner={false} />
                ))}
              </>
            )}
            {items2.length === 0 && (
              <p className="news__empty item__empty">
                <i>{keyword}</i>에 대한 게시물이 없습니다.
              </p>
            )}
          </article>
          <h2 className="itemTitle">{Number(endDate.substring(0, 4)) - 2}</h2>
          <article className="itemGridContainer">
            {userObj ? (
              <>
                {items3.map((item) => (
                  <Item
                    key={item.id}
                    itemObj={item}
                    isOwner={item.creatorId === userObj.uid}
                  />
                ))}
              </>
            ) : (
              <>
                {items3.map((item) => (
                  <Item key={item.id} itemObj={item} isOwner={false} />
                ))}
              </>
            )}
            {items3.length === 0 && (
              <p className="news__empty item__empty">
                <i>{keyword}</i>에 대한 게시물이 없습니다.
              </p>
            )}
          </article>
        </>
      )}
      {more && (
        <div className="moreBtnWrap">
          <button className="formBtn moreBtn" onClick={onClickMore} type="button">
            다음
          </button>
        </div>
      )}
      <div>
        <div className="adfit adfit-l2 adfit-mt2"></div>
        <div className="adfit adfit-m adfit-mt2"></div>
      </div>
    </div>
  );
};

export default Home;
