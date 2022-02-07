import { dbService, storageService } from "fbase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

const ItemFactory = ({ userObj }) => {
  let today = new Date();
  const offset = today.getTimezoneOffset();
  today = new Date(today.getTime() - offset * 60 * 1000);
  const defaultToday = today.toISOString().split("T")[0];

  useEffect(() => {
    setDate(defaultToday);
  }, []);

  const navigate = useNavigate();
  const [title, setTitle] = useState("오늘의 날씨와 경제");
  const [date, setDate] = useState("");
  const [low, setLow] = useState("");
  const [high, setHigh] = useState("");
  const [item, setItem] = useState("");
  const [attachment, setAttachment] = useState("");

  const onTitleChange = (event) => {
    const {
      target: { value },
    } = event;
    setTitle(value);
  };
  const onDateChange = (event) => {
    const {
      target: { value },
    } = event;
    setDate(value);
  };
  const onLowChange = (event) => {
    const {
      target: { value },
    } = event;
    setLow(value);
  };
  const onHighChange = (event) => {
    const {
      target: { value },
    } = event;
    setHigh(value);
  };
  const onSubmit = async (event) => {
    if (item === "") {
      return;
    }
    event.preventDefault();
    let attachmentUrl = "";
    if (attachment !== "") {
      const attachmentRef = storageService
        .ref()
        .child(`${userObj.uid}/${uuidv4()}`);
      const response = await attachmentRef.putString(attachment, "data_url");
      attachmentUrl = await response.ref.getDownloadURL();
    }
    const itemObj = {
      title: title,
      date: date,
      lowestTemp: low,
      highestTemp: high,
      text: item,
      createdAt: today.toISOString(),
      creatorId: userObj.uid,
      attachmentUrl,
    };
    await dbService.collection("items").add(itemObj);
    alert("등록 완료!");
    navigate(-1);
  };
  const onFileChange = (event) => {
    const {
      target: { files },
    } = event;
    const theFile = files[0];
    const reader = new FileReader();
    reader.onloadend = (finishedEvent) => {
      const {
        currentTarget: { result },
      } = finishedEvent;
      setAttachment(result);
    };
    reader.readAsDataURL(theFile);
  };
  const onClearAttachment = () => setAttachment("");

  return (
    <form onSubmit={onSubmit} className="factoryForm">
      <div className="factoryInput__container">
        <div className="factoryInput__title">
          <input
            className="factoryInput__Input"
            value={title}
            onChange={onTitleChange}
            type="text"
          />
          <input
            className="factoryInput__Input"
            value={date.length > 0 ? date : `${defaultToday}`}
            onChange={onDateChange}
            type="date"
          />
          <input
            className="factoryInput__Input"
            value={low}
            placeholder="최저기온"
            onChange={onLowChange}
            type="number"
          />
          <input
            className="factoryInput__Input"
            value={high}
            placeholder="최고기온"
            onChange={onHighChange}
            type="number"
          />
        </div>
        <CKEditor
          editor={ClassicEditor}
          data=""
          onChange={(event, editor) => {
            const data = editor.getData();
            setItem(data);
          }}
        />
        <div className="submitBtns">
          <input
            id="news-submit"
            type="submit"
            value="&rarr;"
            style={{ opacity: 0 }}
          />
          <label htmlFor="news-submit" className="factoryInput__arrow">
            등록
          </label>
        </div>
      </div>
      <label htmlFor="attach-file" className="factoryInput__label">
        <span>사진 첨부</span>
        <FontAwesomeIcon icon={faPlus} />
      </label>
      <input
        id="attach-file"
        type="file"
        accept="image/*"
        onChange={onFileChange}
        style={{ opacity: 0 }}
      />
      {attachment && (
        <div className="factoryForm__attachment">
          <img
            src={attachment}
            style={{ backgroundImage: attachment }}
            alt={title}
          />
          <div className="factoryForm__clear" onClick={onClearAttachment}>
            <span>사진 삭제</span>
            <FontAwesomeIcon icon={faTimes} />
          </div>
        </div>
      )}
    </form>
  );
};

export default ItemFactory;
