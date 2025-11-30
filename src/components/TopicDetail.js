import { dbService } from "fbase";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink } from "@fortawesome/free-solid-svg-icons";
import {
  adfitLong2,
  adfitMobile,
} from "components/ad";
import DOMPurify from "dompurify";

const TopicDetail = ({ userObj, itemId }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [date, setDate] = useState("");
  const [creator, setCreator] = useState("");
  const [news, setNews] = useState("");

  const isOwner = userObj?.uid === news.creatorId;

  useEffect(() => {
    dbService
      .doc(`news/${itemId}`)
      .get()
      .then((doc) => {
        const data = doc.data();
        const content = data.text
          .replace("<p>&lt;iframe", "<iframe")
          .replace("&lt;/iframe&gt;</p>", "</iframe>");
        setTitle(data.title);
        setType(data.type);
        setText(content);
        setUrl(data.url);

        const formattedDate = new Intl.DateTimeFormat("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(data.createdAt));
        setDate(formattedDate);

        setCreator(data.creatorEmail.split("@")[0]);
        setNews(data);
      });
  }, [itemId]);

  useEffect(() => {
    initKakao();
  }, []);

  const initKakao = () => {
    const { Kakao } = window;
    if (Kakao && !Kakao.isInitialized()) {
      Kakao.init(process.env.REACT_APP_KAKAO_KEY);
    }
  };

  const shareToKatalk = () => {
    if (window.Kakao) {
      window.Kakao.Share.createCustomButton({
        container: "#kakao-link-btn",
        templateId: 81320,
        templateArgs: {
          TITLE: `${title}`,
          ID: `${itemId}`,
        },
      });
    }
  };

  const onDeleteClick = async () => {
    const ok = window.confirm("삭제하시겠습니까?");
    if (ok) {
      try {
        await dbService.doc(`news/${itemId}`).delete();
        alert("삭제 완료!");
        navigate("/news");
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("삭제에 실패했습니다: " + error.message);
      }
    }
  };

  let ogurl = "https://weaco.co.kr/news/" + itemId;

  useEffect(() => {
    adfitLong2();
    adfitMobile();
  }, []);

  return (
    <>
      <div className="factoryForm">
        <Helmet>
          <title>{title} - Weaco 토픽</title>
          <meta name="author" content="weaco" />
          <meta name="description" content={text} />
          <meta name="keywords" content={title} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="오늘의 날씨와 경제 - Weaco" />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={text} />
          <meta property="og:url" content={ogurl} />
          <meta property="twitter:card" content="summary" />
          <meta property="twitter:site" content="오늘의 날씨와 경제 - Weaco" />
          <meta property="twitter:title" content={title} />
          <meta property="twitter:description" content={text} />
          <meta property="twitter:url" content={ogurl} />
        </Helmet>
        <div className="factoryInput__container">
          {title && (
            <div className="detail__top">
              <p className="detail__news__type">{type}</p>
              <h2 className="detail__news__title">{title}</h2>
              <h3 className="news__date detail__news__date">
                <span>
                  {date}{" "}
                  <span className="news__creator detail__news__creator">
                    @{creator}
                  </span>
                </span>
                <a
                  className="button__link"
                  target="_blank"
                  href={url}
                  rel="noreferrer"
                  aria-label="원문 보기"
                >
                  <FontAwesomeIcon icon={faLink} /> 원문링크
                </a>
              </h3>
            </div>
          )}

          <div className="detail__content__wrap">
            <div
              className="detail__news"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(text, {
                  ADD_TAGS: ["iframe"],
                  ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "src"],
                }),
              }}
            ></div>
            <div className="detail__content__more">
              <a
                className="button__link"
                target="_blank"
                href={url}
                rel="noreferrer"
                aria-label="자세히 보기"
              >
                <FontAwesomeIcon icon={faLink} /> 자세히 보기
              </a>
            </div>
          </div>
          <div className="adfit adfit-l2"></div>
          <div className="adfit adfit-m"></div>

          <div className="detail__btns">
            <button
              className="factoryInput__arrow actionBtn"
              onClick={() => navigate("/news")}
              aria-label="목록으로 돌아가기"
            >
              목록
            </button>
            {isOwner && (
              <>
                <button
                  onClick={onDeleteClick}
                  className="factoryInput__arrow topicEdit actionBtn"
                  aria-label="삭제"
                >
                  삭제
                </button>
                <Link
                  to={{
                    pathname: `/news/write/${itemId}`,
                    state: { uid: news.creatorId },
                  }}
                  aria-label="수정"
                >
                  <span className="factoryInput__arrow topicEdit">수정</span>
                </Link>
              </>
            )}
            <button
              id="kakao-link-btn"
              className="detail__btn__kakao"
              onClick={shareToKatalk}
              aria-label="카카오톡 공유"
            >
              <img
                src={process.env.PUBLIC_URL + "/kakaotalk_sharing_btn_medium.png"}
                width={"20px"}
                style={{ verticalAlign: "middle", marginRight: 10 }}
                alt=""
                loading="lazy"
              />
              카톡 공유
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TopicDetail;
