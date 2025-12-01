import { useEffect, useState } from "react";
import { dbService } from "fbase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark,
  faNewspaper,
  faEnvelope,
  faAsterisk,
  faPaperclip,
} from "@fortawesome/free-solid-svg-icons";
import NewsBrief from "components/NewsBrief";
import { Helmet } from "react-helmet-async";
import {
  adfitLong,
  adfitLong2,
  adfitMobile,
  adfitMobile2,
} from "components/ad";

const News = ({ userObj }) => {
  const [items, setItems] = useState([]);
  const [type, setType] = useState("");
  const [last, setLast] = useState(null);
  const [more, setMore] = useState(true);

  const itemCount = 20;

  const getNews = async (currentType, startAfterDoc) => {
    let query = dbService.collection("news").orderBy("createdAt", "desc");

    if (currentType) {
      query = dbService
        .collection("news")
        .where("type", "==", currentType)
        .orderBy("createdAt", "desc");
    }

    if (startAfterDoc) {
      query = query.startAfter(startAfterDoc);
    }

    const snapshot = await query.limit(itemCount).get();
    const itemArray = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      items: itemArray,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === itemCount,
    };
  };

  useEffect(() => {
    const loadInitial = async () => {
      const { items, lastDoc, hasMore } = await getNews(type, null);
      setItems(items);
      setLast(lastDoc);
      setMore(hasMore);
    };
    loadInitial();
  }, [type]);

  const onClickType = (event) => {
    const {
      target: { value },
    } = event;
    setType(value);
    window.scrollTo(0, 0);
  };

  const onClickAll = () => {
    setType("");
    window.scrollTo(0, 0);
  };

  const onClickMore = async () => {
    if (!last) return;
    const { items: newItems, lastDoc, hasMore } = await getNews(type, last);
    setItems(newItems);
    setLast(lastDoc);
    setMore(hasMore);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    adfitLong();
    adfitLong2();
    adfitMobile();
    adfitMobile2();
  }, []);

  return (
    <>
      <Helmet>
        <title>Weaco 토픽</title>
        <meta name="description" content="흥미로운 토픽 모음" />
        <meta name="keywords" content="테크,기술,스타트업,디자인,경제,금융,투자,이슈,토픽" />
        <meta name="author" content="weaco" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="오늘의 날씨와 경제 - Weaco" />
        <meta property="og:title" content="Weaco 토픽" />
        <meta property="og:description" content="흥미로운 토픽 모음" />
        <meta property="og:url" content="https://weaco.co.kr/news" />
        <meta property="twitter:card" content="summary" />
        <meta property="twitter:site" content="오늘의 날씨와 경제 - Weaco" />
        <meta property="twitter:title" content="Weaco 토픽" />
        <meta property="twitter:description" content="흥미로운 토픽 모음" />
        <meta property="twitter:url" content="https://weaco.co.kr/news" />
      </Helmet>
      <div className="homeContainer dark newsGrid">
        <span className="news__noti">
          로그인 후 등록 가능합니다. 단, 부적절한 이용은 제재를 받을 수
          있습니다.
        </span>
        <div className="adfit adfit-l"></div>
        <div className="adfit adfit-m2"></div>
        <div className="news__type">
          <label
            htmlFor="type-all"
            className={"commonBtn " + (type === "" ? "selected" : "")}
          >
            <FontAwesomeIcon icon={faAsterisk} />
            전체
          </label>
          <input id="type-all" type="button" value="all" onClick={onClickAll} />
          <label
            htmlFor="type-news"
            className={"commonBtn " + (type === "News" ? "selected" : "")}
          >
            <FontAwesomeIcon icon={faNewspaper} />
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
            <FontAwesomeIcon icon={faBookmark} />
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
            <FontAwesomeIcon icon={faEnvelope} />
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
            <FontAwesomeIcon icon={faPaperclip} />
            기타
          </label>
          <input
            id="type-etc"
            type="button"
            value="Etc"
            onClick={onClickType}
          />
        </div>
        {items.length > 0 ? (
          <>
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
            {more && (
              <div className="moreBtnWrap">
                <span className="formBtn moreBtn" onClick={onClickMore}>
                  다음
                </span>
              </div>
            )}
          </>
        ) : (
          <p className="news__empty">등록된 게시물이 없습니다.</p>
        )}
      </div>
      <div>
        <div className="adfit adfit-l2"></div>
        <div className="adfit adfit-m"></div>
      </div>
    </>
  );
};

export default News;
