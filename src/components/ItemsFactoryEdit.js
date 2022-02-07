import { dbService, storageService } from "fbase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

const ItemFactoryEdit = ({ userObj, itemId }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [low, setLow] = useState("");
  const [high, setHigh] = useState("");
  const [item, setItem] = useState("");
  const [attachment, setAttachment] = useState("");
  const [itemObj, setItemObj] = useState("");

  useEffect(() => {
    dbService
      .doc(`items/${itemId}`)
      .get()
      .then((doc) => {
        const data = doc.data();
        setTitle(data.title);
        setItem(data.text);
        setDate(data.date);
        setLow(data.lowestTemp);
        setHigh(data.highestTemp);
        setItemObj(data);
      });
  }, []);

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
    } else {
      attachmentUrl = itemObj.attachmentUrl;
    }

    const newItemObj = {
      title: title,
      date: date,
      lowestTemp: low,
      highestTemp: high,
      text: item,
      createdAt: itemObj.createdAt,
      creatorId: itemObj.creatorId,
      attachmentUrl,
    };

    await dbService.doc(`items/${itemId}`).update(newItemObj);
    setItem("");
    setTitle("");
    setDate("");
    setAttachment("");
    setLow("");
    setHigh("");
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
  const onDeleteClick = async () => {
    const ok = window.confirm("삭제하시겠습니까?");
    if (ok) {
      await storageService.refFromURL(itemObj.attachmentUrl).delete();
      await dbService.doc(`items/${itemObj.attachmentUrl}`).update({
        attachmentUrl: "",
      });
      alert("사진 삭제 완료!");
      navigate(`/write/${itemId}`);
    }
  };

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
            value={date}
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
          data={itemObj.text}
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
            수정
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
      <div className="factoryForm__attachment">
        {attachment && (
          <>
            <img
              src={attachment}
              style={{ backgroundImage: attachment }}
              alt={itemObj.title}
            />
            <div className="factoryForm__clear" onClick={onClearAttachment}>
              <span>사진 삭제</span>
              <FontAwesomeIcon icon={faTimes} />
            </div>
          </>
        )}
        {itemObj.attachmentUrl && (
          <>
            <img src={itemObj.attachmentUrl} alt={itemObj.title} />
            <div className="factoryForm__clear" onClick={onDeleteClick}>
              <span>기존 사진 삭제</span>
              <FontAwesomeIcon icon={faTimes} />
            </div>
          </>
        )}
      </div>
    </form>
  );
};

export default ItemFactoryEdit;
