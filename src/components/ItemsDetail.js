import { dbService, storageService } from "fbase";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import Indicator from "./Indicator";
import Upbit from "./Upbit";
import {
  adfitLong2,
  adfitMobile,
} from "components/ad";

const ItemDetail = ({ userObj, itemId }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [low, setLow] = useState("");
  const [high, setHigh] = useState("");
  const [text, setText] = useState("");
  const [tags, setTags] = useState([]);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [itemObj, setItemObj] = useState("");
  const [temp, setTemp] = useState("");
  const [isOwner, setOwner] = useState(false);

  // Helper function to parse text
  const parseText = (rawText) => {
    let count = 0;
    return rawText.split("</p><p>").map((line) => (
      <p className="detail__text" key={count++}>
        {line
          .replace("<p>", "")
          .replace("</p>", "")
          .replace("&amp;", "&")
          .replace("&nbsp;", "")
          .split("<br>")
          .map((line2) => (
            <span key={count++}>{line2}</span>
          ))}
      </p>
    ));
  };

  useEffect(() => {
    dbService
      .doc(`items/${itemId}`)
      .get()
      .then((doc) => {
        const data = doc.data();
        const parsedText = parseText(data.text);

        // Remove specific text if present (legacy logic preserved)
        if (parsedText[0] && parsedText[0].props.children[0].props.children.includes("날씨와 경제")) {
          parsedText[0].props.children.shift();
        }
        if (parsedText[1]) {
          parsedText[1].props.children.pop();
        }
        parsedText.pop();

        setTitle(data.title);
        setText(parsedText);
        setDate(data.date);
        setLow(data.lowestTemp);
        setHigh(data.highestTemp);
        setTags(data.tags);
        setAttachmentUrl(data.attachmentUrl);
        setThumbnailUrl(data.thumbnailUrl);
        setItemObj(data);
        userObj && setOwner(data.creatorId === userObj.uid);

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
  }, [itemId, userObj]);

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
        THUMB: `${thumbnailUrl}`,
        ID: `${itemId}`,
      },
    });
  };

  const onDeleteClick = async () => {
    const ok = window.confirm("삭제하시겠습니까?");
    if (ok) {
      try {
        await dbService.doc(`items/${itemId}`).delete();
        await storageService.refFromURL(itemObj.attachmentUrl).delete();
        await storageService.refFromURL(itemObj.thumbnailUrl).delete();
        alert("삭제 완료!");
        navigate("/");
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("삭제에 실패했습니다: " + error.message);
      }
    }
  };

  let ogurl = "https://weaco.co.kr/" + itemId;

  useEffect(() => {
    adfitLong2();
    adfitMobile();
  }, []);

  return (
    <>
      <div className="factoryForm">
        <Helmet>
          <title>{date} 오늘의 날씨와 경제 - Weaco</title>
          <meta name="keywords" content={tags} />
          <meta name="description" content="간단한 날씨 정보와 경제 소식을 알려드립니다." />
          <meta name="author" content="weaco" />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="오늘의 날씨와 경제 - Weaco" />
          <meta property="og:title" content={title} />
          <meta property="og:description" content="간단한 날씨 정보와 경제 소식을 알려드립니다." />
          <meta property="og:image" content={attachmentUrl} />
          <meta property="og:url" content={ogurl} />
          <meta property="twitter:card" content="summary" />
          <meta property="twitter:site" content="오늘의 날씨와 경제 - Weaco" />
          <meta property="twitter:title" content={title} />
          <meta property="twitter:description" content="간단한 날씨 정보와 경제 소식을 알려드립니다." />
          <meta property="twitter:image" content={attachmentUrl} />
          <meta property="twitter:url" content={ogurl} />
        </Helmet>
        <div className="factoryInput__container">
          {itemObj && (
            <>
              <div className="detail__top">
                <h1>{title}</h1>
                <h2 className="item__date">{date}</h2>
                <div className={`item__temperature ${temp}`}>
                  <span>최저 {low}°C</span>
                  <span>최고 {high}°C</span>
                </div>
                <div className="detail__img">
                  {attachmentUrl && (
                    <img src={attachmentUrl} alt={title} width={"100%"} loading="lazy" />
                  )}
                </div>
              </div>
              {itemObj.text.indexOf("<br>S") > 0 && (
                <div className="indicator-wrap">
                  <button className="indicator-arrow prev" aria-label="이전">{'<'}</button>
                  <button className="indicator-arrow next" aria-label="다음">{'>'}</button>
                  <div className="indicatorContainer itemDetail">
                    <Indicator text={itemObj.text} />
                    <Upbit />
                  </div>
                </div>
              )}
            </>
          )}
          <div className="detail__content">{text}</div>
          <div className="adfit adfit-l2"></div>
          <div className="adfit adfit-m"></div>
          <div className="detail__tag">
            <h5>오늘의 이슈</h5>
            {tags.map(
              (tag) =>
                !skipedKeyword.includes(tag) && (
                  <Link key={tag} to={`/`} state={{ tagged: tag }}>
                    <span className="formBtn tagBtn commonBtn">
                      {tag}
                    </span>
                  </Link>
                )
            )}
          </div>
          <div className="detail__btns">
            <button
              type="button"
              className="factoryInput__arrow"
              onClick={() => navigate("/")}
            >
              목록
            </button>
            <button
              id="kakao-link-btn"
              className="detail__btn__kakao"
              onClick={shareToKatalk}
            >
              <img
                src={process.env.PUBLIC_URL + "/kakaotalk_sharing_btn_medium.png"}
                width={"20px"}
                style={{ verticalAlign: "middle", marginRight: 10 }}
                alt={"카카오톡 공유"}
                loading="lazy"
              />
              카톡 공유
            </button>
            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={onDeleteClick}
                  className="factoryInput__arrow topicEdit"
                >
                  삭제
                </button>
                <Link
                  to={{
                    pathname: `/write/${itemId}`,
                    state: { uid: itemObj.creatorId },
                  }}
                  className="factoryInput__arrow topicEdit"
                  style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
                >
                  수정
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ItemDetail;
