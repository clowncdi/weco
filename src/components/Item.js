import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPencilAlt,
  faTrash,
  faNewspaper,
} from "@fortawesome/free-solid-svg-icons";
import { dbService, storageService } from "fbase";
import { useEffect, useState } from "react";
import Modal from "./Modal";

const Item = ({ itemObj, isOwner }) => {
  const [temp, setTemp] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const content = itemObj.text;
  const mid = Number(itemObj.lowestTemp) + Number(itemObj.highestTemp);
  useEffect(() => {
    if (!mid) setTemp("temp__none");
    else if (mid <= -20) setTemp("temp__cold20");
    else if (mid <= -10 && mid > -20) setTemp("temp__cold10");
    else if (mid < 8 && mid > -10) setTemp("temp__cold2");
    else if (mid >= 8 && mid < 15) setTemp("temp__spring");
    else if (mid >= 15 && mid < 30) setTemp("temp__hot15");
    else if (mid >= 30 && mid < 40) setTemp("temp__hot30");
    else if (mid >= 40) setTemp("temp__hot40");
  }, []);
  const onDeleteClick = async () => {
    const ok = window.confirm("삭제하시겠습니까?");
    if (ok) {
      await dbService.doc(`items/${itemObj.id}`).delete();
      await storageService.refFromURL(itemObj.attachmentUrl).delete();
      alert("삭제 완료!");
    }
  };
  const openModal = () => {
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <section className="itemContainer">
      {isOwner && (
        <div className="item__actions">
          <span onClick={onDeleteClick}>
            <FontAwesomeIcon icon={faTrash} />
          </span>
          <Link
            to={{
              pathname: `/write/${itemObj.id}`,
              state: { uid: itemObj.creatorId },
            }}
          >
            <span>
              <FontAwesomeIcon icon={faPencilAlt} />
            </span>
          </Link>
        </div>
      )}
      <h2 className="item__date">{itemObj.date}</h2>
      <header className={`item__temperature ${temp}`}>
        <span>{itemObj.lowestTemp}°C</span>
        <span>{itemObj.highestTemp}°C</span>
        <span className="item__newson">
          <FontAwesomeIcon icon={faNewspaper} /> 간추린 뉴스 보기
        </span>
      </header>

      <div className="item__img">
        <img
          src={
            itemObj.attachmentUrl === ""
              ? process.env.PUBLIC_URL + "/item_default2.jpg"
              : itemObj.attachmentUrl
          }
          onClick={openModal}
          alt={itemObj.title}
        />
      </div>

      <Modal
        open={modalOpen}
        close={closeModal}
        onRequestClose={closeModal}
        header={itemObj.date}
      >
        <h2>{itemObj.title}</h2>
        <div
          className="item__text"
          dangerouslySetInnerHTML={{ __html: content }}
        ></div>
      </Modal>
    </section>
  );
};

export default Item;
