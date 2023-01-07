import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faNewspaper,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";

const Item = ({ itemObj, isOwner }) => {
  const [temp, setTemp] = useState("");
  const [thumbnail, setThumbnail] = useState(itemObj.thumbnailUrl);
  const mid = Number(itemObj.lowestTemp) + Number(itemObj.highestTemp);
  useEffect(() => {
    if (mid === "") setTemp("temp__none");
    else if (mid <= -20) setTemp("temp__cold20");
    else if (mid <= -10 && mid > -20) setTemp("temp__cold10");
    else if (mid < 8 && mid > -10) setTemp("temp__cold2");
    else if (mid >= 8 && mid < 15) setTemp("temp__spring");
    else if (mid >= 15 && mid < 30) setTemp("temp__hot15");
    else if (mid >= 30 && mid < 40) setTemp("temp__hot30");
    else if (mid >= 40 && mid < 50) setTemp("temp__hot40");
    else if (mid >= 50) setTemp("temp__hot50");
  }, []);
  
  if (thumbnail === "" || thumbnail === undefined) {
    setThumbnail(itemObj.attachmentUrl);
  }

  return (
    <section className="itemContainer" tabIndex="0">
      <h2 className="item__date">{itemObj.date}</h2>
      <header className={`item__temperature ${temp}`}>
        <span>{itemObj.lowestTemp}°C</span>
        <span>{itemObj.highestTemp}°C</span>
        <span className="item__newson">
          <FontAwesomeIcon icon={faNewspaper} /> 간추린 뉴스 보기
        </span>
      </header>

      <Link
        to={{
          pathname: `/${itemObj.id}`,
          state: { uid: itemObj.creatorId },
        }}
      >
        <div className="item__img">
          <img
            src={
              itemObj.attachmentUrl === ""
              ? process.env.PUBLIC_URL + "/logo512.png"
              : thumbnail
              // thumbnail === "" || thumbnail === undefined ? 
              // itemObj.attachmentUrl === "" ? 
              // process.env.PUBLIC_URL + "/logo512.png" 
              // : itemObj.attachmentUrl 
              // : thumbnail
            }
            alt={itemObj.title}
            loading="lazy"
          />
        </div>
      </Link>
    </section>
  );
};

export default Item;
