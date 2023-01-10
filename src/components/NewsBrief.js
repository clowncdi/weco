import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faTrash } from "@fortawesome/free-solid-svg-icons";
import { dbService } from "fbase";
import LazyLoad from "react-lazyload";

const NewsBrief = ({ itemObj, isOwner }) => {
  const date = itemObj.createdAt.split("T")[0];

  const content = itemObj.text;
  const emailName = itemObj.creatorEmail.split("@")[0];

  const onDeleteClick = async () => {
    const ok = window.confirm("삭제하시겠습니까?");
    if (ok) {
      await dbService.doc(`news/${itemObj.id}`).delete();
      alert("삭제 완료!");
    }
  };

  return (
    <>
      <section className={"newsContainer __" + itemObj.type} tabIndex="0">
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
                dangerouslySetInnerHTML={{ __html: content }}
              ></div>
            </div>
          </LazyLoad>
        </Link>
      </section>
    </>
  );
};

export default NewsBrief;
