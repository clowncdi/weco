import { useEffect, useState } from "react";
import { dbService } from "fbase";
import NewsBrief from "components/NewsBrief";
import Disqus from "disqus-react";

const News = ({ userObj }) => {
  const [items, setItems] = useState([]);
  const [type, setType] = useState("");
  const [page, setPage] = useState(0);
  const [last, setLast] = useState({});
  const [more, setMore] = useState(true);

  const itemCount = 25;

  useEffect(() => {
    findAll();
  }, [type, page]);

  function findAll() {
    let result = [];
    if (type.length > 0) {
      result = dbService
        .collection("news")
        .where("type", "==", type)
        .orderBy("createdAt", "desc")
        .startAfter(last)
        .limit(itemCount);
    } else {
      result = dbService
        .collection("news")
        .orderBy("createdAt", "desc")
        .startAfter(last)
        .limit(itemCount);
    }

    if (result !== "") {
      result.onSnapshot((snapshot) => {
        const itemArray = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(itemArray);
        setLast(snapshot.docs[snapshot.docs.length - 1]);
        if (snapshot.docs.length < itemCount) setMore(false);
      });
    }
  }

  const onClickType = (event) => {
    setMore(true);
    setLast({});

    const {
      target: { value },
    } = event;
    setType(value);

    window.scrollTo(0, 0);
  };

  const onClickAll = () => {
    setType("");
    setMore(true);
    setLast({});
    setPage(0);
  };

  function onClickMore() {
    setPage(page + 1);
    window.scrollTo(0, 0);
  }

  const disqusShortname = "weco";
  const disqusConfig = {
    url: "https://clowncdi.github.io/weco/news",
    identifier: "news",
    title: "뉴스",
  };

  return (
    <>
      <div className="homeContainer dark newsGrid">
        <span className="news__noti">
          부적절한 이용은 관리자에 의해 제재를 받을 수 있습니다.
        </span>
        <div className="news__type">
          <label
            htmlFor="type-all"
            className={"commonBtn " + (type === "" ? "selected" : "")}
          >
            전체
          </label>
          <input id="type-all" type="button" value="all" onClick={onClickAll} />
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
      <Disqus.DiscussionEmbed
        shortname={disqusShortname}
        config={disqusConfig}
      />
    </>
  );
};

export default News;
