import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faNewspaper,
} from "@fortawesome/free-solid-svg-icons";
import LazyLoad from "react-lazyload";

const Item = ({ itemObj, isOwner }) => {
  const thumbnail = itemObj.thumbnailUrl || itemObj.attachmentUrl;

  // Calculate average temperature
  const mid = (Number(itemObj.lowestTemp) + Number(itemObj.highestTemp)) / 2;

  let tempClass = "temp__none";
  if (itemObj.lowestTemp && itemObj.highestTemp) {
    if (mid <= -20) tempClass = "temp__cold20";
    else if (mid <= -10) tempClass = "temp__cold10";
    else if (mid < 8) tempClass = "temp__cold2";
    else if (mid < 15) tempClass = "temp__spring";
    else if (mid < 30) tempClass = "temp__hot15";
    else if (mid < 40) tempClass = "temp__hot30";
    else if (mid < 50) tempClass = "temp__hot40";
    else tempClass = "temp__hot50";
  }

  return (
    <section className="itemContainer" tabIndex="0">
      <h2 className="item__date">{itemObj.date}</h2>
      <header className={`item__temperature ${tempClass}`}>
        <span>{itemObj.lowestTemp}°C</span>
        <span>{itemObj.highestTemp}°C</span>
        <span className="item__newson">
          <FontAwesomeIcon icon={faNewspaper} /> 간추린 뉴스 보기
        </span>
      </header>

      <Link
        to={`/${itemObj.id}`}
        state={{ uid: itemObj.creatorId }}
      >
        <LazyLoad offset={1000}>
          <div className="item__img">
            <img
              src={
                thumbnail || process.env.PUBLIC_URL + "/logo512.png"
              }
              alt={itemObj.title}
            />
          </div>
        </LazyLoad>
      </Link>
    </section>
  );
};

export default Item;
