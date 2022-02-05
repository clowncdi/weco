import { useEffect, useState } from "react";
import { dbService } from "fbase";
import Item from "components/Item";

const Home = ({ userObj }) => {
  const [items, setItems] = useState([]);
  useEffect(() => {
    dbService
      .collection("items")
      .where("creatorId", "==", "Vf46gZOvLVagkCQbvZxSqXyjrDu1")
      .orderBy("date", "desc")
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
    </div>
  );
};

export default Home;
