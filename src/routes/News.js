import { useEffect, useState } from "react";
import { dbService } from "fbase";
import NewsBrief from "components/NewsBrief";

const News = ({ userObj }) => {
  const [items, setItems] = useState([]);
  const [etcs, setEtcs] = useState([]);
  useEffect(() => {
    dbService
      .collection("news")
      .where("type", "==", "News")
      .orderBy("createdAt", "desc")
      .onSnapshot((snapshot) => {
        const itemArray = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(itemArray);
      });
    dbService
      .collection("news")
      .where("type", "==", "Etc")
      .orderBy("createdAt", "desc")
      .onSnapshot((snapshot) => {
        const etcArray = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEtcs(etcArray);
      });
  }, []);

  return (
    <div className="homeContainer dark">
      <span className="news__noti">
        * 성격에 맞지 않은 글이나 도배 등 부적절한 이용은 관리자에 의해 제재를
        받을 수 있습니다.
      </span>
      {items.length > 0 ? (
        <article className="newsGridContainer">
          <div className="newsGrid">
            <h2>인상적인 경제뉴스를 공유해주세요</h2>
            {userObj ? (
              <>
                {items.map((item) => (
                  <NewsBrief
                    key={item.id}
                    itemObj={item}
                    isOwner={item.creatorId === userObj.uid}
                  />
                ))}
              </>
            ) : (
              <>
                {items.map((item) => (
                  <NewsBrief key={item.id} itemObj={item} isOwner={false} />
                ))}
              </>
            )}
          </div>
          <div className="newsGrid">
            <h2>기타 소식</h2>
            {userObj ? (
              <>
                {etcs.map((item) => (
                  <NewsBrief
                    key={item.id}
                    itemObj={item}
                    isOwner={item.creatorId === userObj.uid}
                  />
                ))}
              </>
            ) : (
              <>
                {etcs.map((item) => (
                  <NewsBrief key={item.id} itemObj={item} isOwner={false} />
                ))}
              </>
            )}
          </div>
        </article>
      ) : (
        <p className="empty">등록된 게시물이 없습니다.</p>
      )}
    </div>
  );
};

export default News;
