import { dbService } from "fbase";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const NewsFactory = ({ userObj }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("News");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");

  let today = new Date();
  const offset = today.getTimezoneOffset();
  today = new Date(today.getTime() - offset * 60 * 1000);

  const onTitleChange = (event) => {
    const {
      target: { value },
    } = event;
    setTitle(value);
  };
  const onTypeChange = (event) => {
    const {
      target: { value },
    } = event;
    setType(value);
  };
  const onUrlChange = (event) => {
    const {
      target: { value },
    } = event;
    setUrl(value);
  };
  const onTextChange = (event) => {
    let {
      target: { value },
    } = event;
    setText(value);
  };
  const onSubmit = async (event) => {
    if (type === "") return alert("카테고리를 입력해 주세요");
    if (title === "") return alert("제목을 입력해 주세요");
    if (url === "") return alert("뉴스의 URL 주소를 입력해 주세요");
    if (text === "") return alert("뉴스를 간단하게 요약해 주세요");

    event.preventDefault();
    const newsObj = {
      title: title,
      type: type,
      url: url,
      text: text.replaceAll(/(\n|\r\n)/g, "<br>"),
      createdAt: today.toISOString(),
      updatedAt: today.toISOString(),
      creatorId: userObj.uid,
    };
    await dbService.collection("news").add(newsObj);
    alert("등록 완료!");
    navigate(-1);
  };

  return (
    <form onSubmit={onSubmit} className="factoryForm">
      <div className="factoryInput__container">
        <div className="newsFactoryInput__radio">
          <label htmlFor="News">
            <input
              value="News"
              id="News"
              name="type"
              type="radio"
              defaultChecked
              onChange={onTypeChange}
            />
            뉴스
          </label>
          <label htmlFor="Bookmark">
            <input
              value="Bookmark"
              id="Bookmark"
              name="type"
              type="radio"
              onChange={onTypeChange}
            />
            북마크
          </label>
          <label htmlFor="Newsletter">
            <input
              value="Newsletter"
              id="Newsletter"
              name="type"
              type="radio"
              onChange={onTypeChange}
            />
            뉴스레터
          </label>
          <label htmlFor="Etc">
            <input
              value="Etc"
              id="Etc"
              name="type"
              type="radio"
              onChange={onTypeChange}
            />
            기타
          </label>
        </div>
        <div className="newsFactoryInput__title">
          <span>제목</span>
          <input
            className="factoryInput__Input"
            value={title}
            onChange={onTitleChange}
            type="text"
          />
        </div>
        <div className="newsFactoryInput__title">
          <span>링크</span>
          <input
            className="factoryInput__Input"
            value={url}
            onChange={onUrlChange}
            placeholder="뉴스 URL 주소를 입력해 주세요"
            type="url"
          />
        </div>
        <textarea
          className="newsFactoryInput__title"
          value={text}
          onChange={onTextChange}
          placeholder="뉴스를 간단하게 요약해 주세요"
        />
        <label htmlFor="news-submit" className="factoryInput__arrow">
          등록
        </label>
        <input
          id="news-submit"
          type="submit"
          value="&rarr;"
          className="factoryInput__arrow"
          style={{ opacity: 0 }}
        />
      </div>
    </form>
  );
};

export default NewsFactory;
