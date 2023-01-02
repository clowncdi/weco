import { dbService } from "fbase";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink } from "@fortawesome/free-solid-svg-icons";
// import Disqus from "disqus-react";
import {
  // adfitLong,
  adfitLong2,
  adfitMobile,
  // adfitMobile3,
} from "components/ad";

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
        setDate(data.createdAt.split("T")[0]);
        setCreator(data.creatorEmail.split("@")[0]);
        setNews(data);
      });
  }, []);

  useEffect(() => {
    initKakao();
  }, []);

  const initKakao = () => {
    const { Kakao } = window;
    if (!Kakao.isInitialized()) {
      Kakao.init(process.env.REACT_APP_KAKAO_KEY);
    }
  };

  const shareToKatalk = () => {
    window.Kakao.Share.createCustomButton({
      container: "#kakao-link-btn",
      templateId: 81320,
      templateArgs: {
        TITLE: `${title}`,
        ID: `${itemId}`,
      },
    });
  };

  const onDeleteClick = async () => {
    const ok = window.confirm("삭제하시겠습니까?");
    if (ok) {
      await dbService.doc(`news/${itemId}`).delete();
      alert("삭제 완료!");
    }
  };

  // const disqusShortname = "weco";
  // const disqusConfig = {
  //   url: window.location.href,
  //   identifier: itemId,
  //   title: title,
  // };

  let ogurl = "https://weaco.co.kr/news/" + { itemId };

  useEffect(() => {
    // adfitLong();
    adfitLong2();
    adfitMobile();
    // adfitMobile3();
  }, []);

  return (
    <>
      <div className="factoryForm">
        <Helmet>
          <title>{title} - Weaco 토픽</title>
          <meta name="description" content={text} />
          <meta name="keywords" content={title} />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={text} />
          <meta name="og:url" content={ogurl} />
        </Helmet>
        <div className="factoryInput__container">
          {/* <div className="adfit adfit-l"></div>
          <div className="adfit adfit-m3"></div> */}
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
                >
                  <FontAwesomeIcon icon={faLink} /> 원문링크
                </a>
              </h3>
            </div>
          )}

          <div className="detail__content__wrap">
            <div
              className="detail__news"
              dangerouslySetInnerHTML={{ __html: text }}
            ></div>
            <div className="detail__content__more">
              <a
                className="button__link"
                target="_blank"
                href={url}
                rel="noreferrer"
              >
                <FontAwesomeIcon icon={faLink} /> 자세히 보기
              </a>
            </div>
          </div>
          <div className="adfit adfit-l2"></div>
          <div className="adfit adfit-m"></div>

          <div className="detail__btns">
            <label
              className="factoryInput__arrow"
              onClick={() => navigate("/news")}
            >
              목록
            </label>
            {isOwner && (
              <>
                <span
                  onClick={onDeleteClick}
                  className="factoryInput__arrow topicEdit"
                >
                  삭제
                </span>
                <Link
                  to={{
                    pathname: `/news/write/${itemId}`,
                    state: { uid: news.creatorId },
                  }}
                >
                  <span className="factoryInput__arrow topicEdit">수정</span>
                </Link>
              </>
            )}
            <button
              id="kakao-link-btn"
              className="detail__btn__kakao"
              onClick={shareToKatalk}
            >
              <img
                src="https://developers.kakao.com/assets/img/about/logos/kakaotalksharing/kakaotalk_sharing_btn_medium.png"
                width={"20px"}
                style={{ verticalAlign: "middle", marginRight: 10 }}
                alt={"카카오톡 공유"}
                loading="lazy"
              />
              카톡 공유
            </button>
          </div>
        </div>
      </div>
      {/* <Disqus.DiscussionEmbed
        shortname={disqusShortname}
        config={disqusConfig}
      /> */}
    </>
  );
};

export default TopicDetail;
