import { dbService, storageService } from "fbase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import imageCompression from "browser-image-compression";
import CreateWeatherImage from "./CreateWeatherImage";

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
  const [tags, setTags] = useState([]);
  const [attachment, setAttachment] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [ext, setExt] = useState("");

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
    let thumbnailUrl = "";
    if (attachment !== "") {
      const attachmentRef = storageService
        .ref()
        .child(`${userObj.uid}/${uuidv4()}${ext ? "." + ext : ".jpg"}`);
      const response = await attachmentRef.putString(attachment, "data_url");
      attachmentUrl = await response.ref.getDownloadURL();
    }
    if (thumbnail !== "") {
      const thumbnailRef = storageService
        .ref()
        .child(`thumbnails/${uuidv4()}.webp`);
      const response = await thumbnailRef.putString(thumbnail, "data_url");
      thumbnailUrl = await response.ref.getDownloadURL();
    }
    const itemObj = {
      title: title,
      date: date,
      lowestTemp: low,
      highestTemp: high,
      text: item,
      tags: tags,
      createdAt: today.toISOString(),
      creatorId: userObj.uid,
      attachmentUrl,
      thumbnailUrl,
    };
    const docRef = await dbService.collection("items").add(itemObj);
    alert("등록 완료!");
    navigate(`/${docRef.id}`);
  };

  const onClearAttachment = () => setAttachment("");

  async function handleImageUpload(event) {
    let imageFile = event.target.files[0];
    console.log(`originalFile size ${imageFile.size / 1024 / 1024} MB`);
    if (imageFile.name.indexOf(".") > 0) {
      let ext = imageFile.name.split(".");
      setExt(ext[ext.length - 1]);
    }

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1000,
      useWebWorker: true,
      initialQuality: 0.7,
    };
    try {
      const compressedFile = await imageCompression(imageFile, options);
      console.log(
        `compressedFile size ${compressedFile.size / 1024 / 1024} MB`
      );
      const reader = new FileReader();
      reader.onloadend = (finishedEvent) => {
        const {
          currentTarget: { result },
        } = finishedEvent;
        setAttachment(result);

        console.log("Create Thumbnail");
        const width = 300;
        const height = 300;
        const image = new Image();
        image.width = width;
        image.height = height;
        image.title = "thumbnail";
        image.src = result;

        image.onload = function () {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(image, 0, 0, width, height);
          const dataUri = canvas.toDataURL("image/webp", 0.7);
          setThumbnail(dataUri);
          const thumb = new Image();
          thumb.src = dataUri;
          document.getElementById("thumbnail").appendChild(thumb);
        };
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.log(error);
    }
  }

  const onClickTags = () => {
    if (item === "") return;
    const start = item.indexOf("#");
    const tagsOriginal = item.substring(start);
    const result = splitTags(tagsOriginal);
    setTags(result);
  };

  function splitTags(tagsString) {
    let result = tagsString.replaceAll("<p>", "");
    result = result.replaceAll("</p>", "");
    result = result.replaceAll("#", "");
    result = result.split(" ");
    return result;
  }

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
        <div className="factoryInput__tag">
          <input
            className="commonBtn formBtn"
            onClick={onClickTags}
            value="Tag 불러오기"
            type="button"
          />
          {tags.map((tag) => (
            <span className="formBtn tagBtn">{tag}</span>
          ))}
        </div>
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
      <CreateWeatherImage />
      <label htmlFor="attach-file" className="factoryInput__label">
        <span>사진 첨부</span>
        <FontAwesomeIcon icon={faPlus} />
      </label>
      <input
        id="attach-file"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
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
          <div id="thumbnail"></div>
        </div>
      )}
    </form>
  );
};

export default ItemFactory;
