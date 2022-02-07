import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPencilAlt,
  faTrash,
  faLink,
} from "@fortawesome/free-solid-svg-icons";
import { dbService } from "fbase";
import { useState } from "react";
import Modal from "./Modal";

const NewsBrief = ({ itemObj, isOwner }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const date = itemObj.createdAt.split("T")[0];

  const content = itemObj.text;
  const onDeleteClick = async () => {
    const ok = window.confirm("삭제하시겠습니까?");
    if (ok) {
      await dbService.doc(`news/${itemObj.id}`).delete();
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
    <>
      <section className={"newsContainer " + "__" + itemObj.type}>
        {isOwner && (
          <div className="item__actions news__actions">
            <span onClick={onDeleteClick}>
              <FontAwesomeIcon icon={faTrash} />
            </span>
            <Link
              to={{
                pathname: `/news/write/${itemObj.id}`,
                state: { uid: itemObj.creatorId },
              }}
            >
              <span>
                <FontAwesomeIcon icon={faPencilAlt} />
              </span>
            </Link>
          </div>
        )}
        <div className="newsContainer__link" onClick={openModal}>
          <h3 className="news__date">{date}</h3>
          <h3 className="news__title">{itemObj.title}</h3>
          <div
            className="news__text"
            dangerouslySetInnerHTML={{ __html: content }}
          ></div>
        </div>
      </section>
      <Modal
        open={modalOpen}
        close={closeModal}
        onRequestClose={closeModal}
        header={"간략보기"}
      >
        <h2 className="modal__title">
          {itemObj.title}
          <a target="_blank" href={itemObj.url} rel="noreferrer">
            _ <FontAwesomeIcon icon={faLink} style={{ opacity: 0.5 }} />
          </a>
        </h2>
        <div
          className="item__text"
          dangerouslySetInnerHTML={{ __html: content }}
        ></div>
        <a
          className="modal__link"
          target="_blank"
          href={itemObj.url}
          rel="noreferrer"
        >
          자세히
        </a>
      </Modal>
    </>
  );
};

export default NewsBrief;
