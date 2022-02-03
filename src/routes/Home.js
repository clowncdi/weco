import { useEffect, useState } from "react";
import { dbService } from "fbase";
import Item from "../components/Item";

const Home = ({ userObj }) => {
  const [items, setItems] = useState([]);
  useEffect(() => {
    dbService
      .collection("items")
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
    <div className="container">
      {items.map((item) => (
        <Item
          key={item.id}
          itemObj={item}
          isOwner={item.creatorId === userObj.uid}
        />
      ))}
    </div>
  );
};

export default Home;
