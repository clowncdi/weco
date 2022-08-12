import { dbService, storageService } from "fbase";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

const ItemDetail = ({ userObj, itemId }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [low, setLow] = useState("");
  const [high, setHigh] = useState("");
  const [text, setText] = useState("");
  const [tags, setTags] = useState([]);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [itemObj, setItemObj] = useState("");
  const [temp, setTemp] = useState("");

  useEffect(() => {
    let count = 0;

    dbService
      .doc(`items/${itemId}`)
      .get()
      .then((doc) => {
        const data = doc.data();
        const text = data.text.split("</p><p>").map((line) => {
          return (
            <p className="detail__text" key={count + 1}>
              {line
                .replace("<p>", "")
                .replace("</p>", "")
                .replace("&amp;", "&")
                .replace("&nbsp;", "")
                .split("<br>")
                .map((line2) => {
                  count = count + 1;
                  return <span key={count}>{line2}</span>;
                })}
            </p>
          );
        });

        text[0].props.children.shift();
        text[1].props.children.pop();
        text.pop();

        setTitle(data.title);
        setText(text);
        setDate(data.date);
        setLow(data.lowestTemp);
        setHigh(data.highestTemp);
        setTags(data.tags);
        setAttachmentUrl(data.attachmentUrl);
        setItemObj(data);

        const mid = Number(data.lowestTemp) + Number(data.highestTemp);
        if (mid === "") setTemp("temp__none");
        else if (mid <= -20) setTemp("temp__cold20");
        else if (mid <= -10 && mid > -20) setTemp("temp__cold10");
        else if (mid < 8 && mid > -10) setTemp("temp__cold2");
        else if (mid >= 8 && mid < 15) setTemp("temp__spring");
        else if (mid >= 15 && mid < 30) setTemp("temp__hot15");
        else if (mid >= 30 && mid < 40) setTemp("temp__hot30");
        else if (mid >= 40 && mid < 50) setTemp("temp__hot40");
        else if (mid >= 50) setTemp("temp__hot50");
      });
  }, []);

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
    initKakao();
  }, []);

  const initKakao = () => {
    const { Kakao } = window;
    if (!Kakao.isInitialized()) {
      Kakao.init(process.env.REACT_APP_KAKAO_KEY);
    }
  };

  const editedTags = tags.filter((tag) => !skipedKeyword.includes(tag));
  const shareToKatalk = () => {
    window.Kakao.Share.createCustomButton({
      container: "#kakao-link-btn",
      templateId: 81294,
      templateArgs: {
        TITLE: `${title}`,
        DATE: `${date}`,
        TAGS: `${editedTags}`,
        THUMB: `${attachmentUrl}`,
        ID: `${itemId}`,
      },
    });
  };

  return (
    <>
      <Helmet>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6288876729056336"
          crossorigin="anonymous"
        ></script>
      </Helmet>
      <div className="factoryForm">
        <div className="factoryInput__container">
          {itemObj && (
            <div className="detail__top">
              <h1>{title}</h1>
              <h2 className="item__date">{date}</h2>
              <div className={`item__temperature ${temp}`}>
                <span>최저 {low}°C</span>
                <span>최고 {high}°C</span>
              </div>
              <div className="detail__img">
                {attachmentUrl && (
                  <img src={attachmentUrl} alt={title} width={"100%"} />
                )}
              </div>
            </div>
          )}
          <div className="detail__content">{text}</div>
          <div className="detail__tag">
            <h5>오늘의 이슈</h5>
            {tags.map(
              (tag) =>
                !skipedKeyword.includes(tag) && (
                  <span className="formBtn tagBtn" key={tag}>
                    {tag}
                  </span>
                )
            )}
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
              />
              카톡 공유
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ItemDetail;