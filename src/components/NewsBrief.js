import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faTrash } from "@fortawesome/free-solid-svg-icons";
import { dbService } from "fbase";
import LazyLoad from "react-lazyload";
import DOMPurify from "dompurify";

const NewsBrief = ({ itemObj, isOwner }) => {
  const date = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(itemObj.createdAt));

  const content = itemObj.text;
  const emailName = itemObj.creatorEmail.split("@")[0];

  const onDeleteClick = async () => {
    const ok = window.confirm("삭제하시겠습니까?");
    if (ok) {
      try {
        await dbService.doc(`news/${itemObj.id}`).delete();
        alert("삭제 완료!");
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("삭제에 실패했습니다: " + error.message);
      }
    }
  };

  return (
    <section className={"newsContainer __" + itemObj.type}>
      {isOwner && (
        <div className="item__actions news__actions">
          <button onClick={onDeleteClick} aria-label="삭제" className="actionBtn">
            <FontAwesomeIcon icon={faTrash} />
          </button>
          <Link
            to={{
              pathname: `/news/write/${itemObj.id}`,
              state: { uid: itemObj.creatorId },
            }}
            aria-label="수정"
          >
            <span className="actionBtn">
              <FontAwesomeIcon icon={faPencilAlt} />
            </span>
          </Link>
        </div>
      )}
      <Link
        to={{
          pathname: `/news/${itemObj.id}`,
          state: { uid: itemObj.creatorId },
        }}
      >
        <LazyLoad offset={1000}>
          <div className="newsContainer__link">
            <h3 className="news__date">
              {date} <span className="news__creator">@{emailName}</span>
            </h3>

            <h3 className="news__title">{itemObj.title}</h3>
            <div
              className="news__text"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
            ></div>
          </div>
        </LazyLoad>
      </Link>
    </section>
  );
};

export default NewsBrief;
