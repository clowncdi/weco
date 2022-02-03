import { dbService, storageService } from "fbase";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

const ItemFactory = ({ userObj }) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [item, setItem] = useState("");
  const [attachment, setAttachment] = useState("");

  let today = new Date();
  const offset = today.getTimezoneOffset();
  today = new Date(today.getTime() - offset * 60 * 1000);

  const onItemChange = (event) => {
    const {
      target: { value },
    } = event;
    setItem(value);
  };
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
      text: item,
      createdAt: today.toISOString(),
      creatorId: userObj.uid,
      attachmentUrl,
    };
    await dbService.collection("items").add(itemObj);
    setItem("");
    setTitle("");
    setDate("");
    setAttachment("");
    alert("등록 완료!");
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
            value={title === "" ? "오늘의 날씨와 경제" : title}
            onChange={onTitleChange}
            type="text"
          />
          <input
            className="factoryInput__Input"
            value={date === "" ? today.toISOString().split("T")[0] : date}
            onChange={onDateChange}
            type="date"
          />
        </div>
        <CKEditor
          editor={ClassicEditor}
          data=""
          onChange={(event, editor) => {
            const data = editor.getData();
            editor.setData(data);
            setItem(data);
          }}
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
          <img src={attachment} style={{ backgroundImage: attachment }} />
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
