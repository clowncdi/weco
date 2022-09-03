import { dbService } from "fbase";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { EditorBox } from "./ToastEditor";

const NewsFactoryEdit = ({ userObj, itemId }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [imgUrl, setImgUrl] = useState("");

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
      });
  }, []);

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

  const editorRef = useRef();
  const onContentChange = () => {
    setText(editorRef.current?.getInstance().getHTML());
  };

  const onSubmit = async (event) => {
    let today = new Date();
    const offset = today.getTimezoneOffset();
    today = new Date(today.getTime() - offset * 60 * 1000);

    if (title === "") return alert("제목을 입력해 주세요");
    if (url === "") return alert("토픽 출처 URL 주소를 입력해 주세요");
    if (text === "") return alert("토픽을 간단하게 요약해 주세요");

    event.preventDefault();
    const newItemObj = {
      title: title,
      type: type,
      url: url,
      text: text,
      updatedAt: today.toISOString(),
      creatorEmail: userObj.email,
    };

    await dbService.doc(`news/${itemId}`).update(newItemObj);
    alert("수정 완료!");
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
              onChange={onTypeChange}
              checked={type === "News" ? true : false}
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
              checked={type === "Bookmark" ? true : false}
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
              checked={type === "Newsletter" ? true : false}
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
              checked={type === "Etc" ? true : false}
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
          <span>출처</span>
          <input
            className="factoryInput__Input"
            value={url}
            placeholder="출처 링크를 입력해 주세요"
            onChange={onUrlChange}
            type="url"
          />
        </div>
        {text && (
          <EditorBox
            editorRef={editorRef}
            onChange={onContentChange}
            text={text}
          />
        )}
        <label htmlFor="news-submit" className="factoryInput__arrow">
          수정
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

export default NewsFactoryEdit;
