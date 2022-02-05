import { useEffect, useState } from "react";
import { dbService } from "fbase";
import Item from "components/Item";

const Weco = ({ userObj }) => {
  const [items, setItems] = useState([]);
  useEffect(() => {
    dbService
      .collection("items")
      .where("creatorId", "!=", "Vf46gZOvLVagkCQbvZxSqXyjrDu1")
      .orderBy("creatorId", "asc")
      .orderBy("createdAt", "desc")
      .onSnapshot((snapshot) => {
        const itemArray = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(itemArray);
      });
  }, []);

  return (
    <div className="homeContainer dark">
      {items.length > 0 ? (
        <article className="itemGridContainer">
          {userObj ? (
            <>
              {items.map((item) => (
                <Item
                  key={item.id}
                  itemObj={item}
                  isOwner={item.creatorId === userObj.uid}
                />
              ))}
            </>
          ) : (
            <>
              {items.map((item) => (
                <Item key={item.id} itemObj={item} isOwner={false} />
              ))}
            </>
          )}
        </article>
      ) : (
        <p className="empty">등록된 게시물이 없습니다.</p>
      )}
    </div>
  );
};

export default Weco;
