import { dbService, storageService } from "fbase";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink } from "@fortawesome/free-solid-svg-icons";
import Disqus from "disqus-react";

const TopicDetail = ({ userObj, itemId }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [date, setDate] = useState("");
  const [creator, setCreator] = useState("");
  const [news, setNews] = useState("");

  useEffect(() => {
    dbService
      .doc(`news/${itemId}`)
      .get()
      .then((doc) => {
        const data = doc.data();
        setTitle(data.title);
        setType(data.type);
        setText(data.text);
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

  const disqusShortname = "weco";
  const disqusConfig = {
    url: window.location.href,
    identifier: itemId,
    title: title,
  };

  return (
    <>
      <div className="factoryForm">
        <Helmet>
          <title>{title} - Weaco 토픽</title>
          <meta name="description" content={text} />
          <meta name="keywords" content={title} />
          <meta property="og:title" content={title} />
          <meta
            property="og:image"
            content={process.env.PUBLIC_URL + "/logo2.png"}
          />
          <meta property="og:description" content={text} />
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
                  className="modal__link"
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
                className="modal__link"
                target="_blank"
                href={url}
                rel="noreferrer"
              >
                <FontAwesomeIcon icon={faLink} /> 자세히 보기
              </a>
            </div>
          </div>

          <div className="detail__btns">
            <label className="factoryInput__arrow" onClick={() => navigate(-1)}>
              목록
            </label>
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
              />
              카톡 공유
            </button>
          </div>
        </div>
      </div>
      <Disqus.DiscussionEmbed
        shortname={disqusShortname}
        config={disqusConfig}
      />
    </>
  );
};

export default TopicDetail;
