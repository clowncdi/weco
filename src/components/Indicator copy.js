import { useState, useEffect } from "react";
import { dbService } from "./../fbase";

const Indicator = () => {
  const [textData, setTextData] = useState("");
  const [dow, setDow] = useState("");
  const [nasdoq, setNasdoq] = useState("");
  const [sp500, setSp500] = useState("");
  const [wti, setWti] = useState("");
  const [dxy, setDxy] = useState("");
  const [vix, setVix] = useState("");
  const [gold, setGold] = useState("");

  useEffect(() => {
    dbService
      .collection("items")
      .where("creatorId", "==", process.env.REACT_APP_ADMIN)
      .orderBy("date", "desc")
      .limit(1)
      .onSnapshot((snapshot) => {
        if (snapshot.docs.length === 0) {
          return setTextData("");
        }
        const item = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTextData(item.shift().text);
      });
  }, []);

  if (textData.length > 0) {
    const startPoint = textData.indexOf("<br>다우");
    const endPoint = textData.indexOf("원</p>");
    const lineData = textData.slice(startPoint + 4, endPoint + 1);

    const _dow = sliceLine(lineData, "다우");
    setDow(_dow);
    const _nasdaq = sliceLine(lineData, "나스닥");
    setNasdoq(_nasdaq);
    const _sp500 = sliceLine(lineData, "S&amp;P500");
    setSp500(_sp500);
    const _wti = sliceLine(lineData, "WTI");
    setWti(_wti);
    const _dxy = sliceLine(lineData, "달러인덱스");
    setDxy(_dxy);
    const _vix = sliceLine(lineData, "VIX");
    setVix(_vix);
    const _gold = sliceLine(lineData, "금");
    setGold(_gold);
  }

  function sliceLine(lineData, title) {
    const startPoint = lineData.indexOf(title);
    const endPoint = lineData.indexOf(",", startPoint);
    return lineData.slice(startPoint + title.length, endPoint);
  }

  return (
    <>
      <div className="indicatorWrap">
        <h3>다우</h3>
        <span>{dow}</span>
      </div>
      <div className="indicatorWrap">
        <h3>나스닥</h3>
        <span>{nasdoq}</span>
      </div>
      <div className="indicatorWrap">
        <h3>S&P500</h3>
        <span>{sp500}</span>
      </div>
      <div className="indicatorWrap">
        <h3>WTI</h3>
        <span>{wti}</span>
      </div>
      <div className="indicatorWrap">
        <h3>달러인덱스</h3>
        <span>{dxy}</span>
      </div>
      <div className="indicatorWrap">
        <h3>VIX</h3>
        <span>{vix}</span>
      </div>
      <div className="indicatorWrap">
        <h3>금</h3>
        <span>{gold}</span>
      </div>
    </>
  );
};

export default Indicator;
