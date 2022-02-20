import { useState, useEffect } from "react";

const Indicator = ({ text }) => {
  const [sp500, setSp500] = useState("");
  const [dow, setDow] = useState("");
  const [nasdoq, setNasdoq] = useState("");
  const [wti, setWti] = useState("");
  const [dxy, setDxy] = useState("");
  const [vix, setVix] = useState("");
  const [gold, setGold] = useState("");

  useEffect(() => {
    const startPoint = text.indexOf("<br>S");
    const endPoint = text.indexOf("원</p>");
    const lineDataOrigin = text.slice(startPoint + 4, endPoint + 1);
    const line = lineDataOrigin.replaceAll(")", "");
    setSp500(sliceLine(line, "S&amp;P500"));
    setDow(sliceLine(line, "다우"));
    setNasdoq(sliceLine(line, "나스닥"));
    setWti(sliceLine(line, "WTI"));
    setDxy(sliceLine(line, "달러인덱스"));
    setVix(sliceLine(line, "VIX"));
    setGold(sliceLine(line, "금"));
  }, []);

  const sliceLine = (line, title) => {
    const startPoint = line.indexOf(title);
    const endPoint = line.indexOf(",", startPoint);
    return line.slice(startPoint + title.length, endPoint);
  };
  const sp500Array = sp500.split("(");
  const dowArray = dow.split("(");
  const nasdoqArray = nasdoq.split("(");
  const wtiArray = wti.split("(");
  const dxyArray = dxy.split("(");
  const vixArray = vix.split("(");
  const goldArray = gold.split("(");

  return (
    <>
      <div className={sp500.indexOf("-") > 0 ? "minus" : ""}>
        <h3>S&P500</h3>
        <span>{sp500Array[0]}</span>
        <span>{sp500Array[1]}</span>
      </div>
      <div className={dow.indexOf("-") > 0 ? "minus" : ""}>
        <h3>다우</h3>
        <span>{dowArray[0]}</span>
        <span>{dowArray[1]}</span>
      </div>
      <div className={nasdoq.indexOf("-") > 0 ? "minus" : ""}>
        <h3>나스닥</h3>
        <span>{nasdoqArray[0]}</span>
        <span>{nasdoqArray[1]}</span>
      </div>
      <div className={wti.indexOf("-") > 0 ? "minus" : ""}>
        <h3>WTI</h3>
        <span>{wtiArray[0]}</span>
        <span>{wtiArray[1]}</span>
      </div>
      <div className={dxy.indexOf("-") > 0 ? "minus" : ""}>
        <h3>달러인덱스</h3>
        <span>{dxyArray[0]}</span>
        <span>{dxyArray[1]}</span>
      </div>
      <div className={vix.indexOf("-") > 0 ? "minus" : ""}>
        <h3>VIX</h3>
        <span>{vixArray[0]}</span>
        <span>{vixArray[1]}</span>
      </div>
      <div className={gold.indexOf("-") > 0 ? "minus" : ""}>
        <h3>금</h3>
        <span>{goldArray[0]}</span>
        <span>{goldArray[1]}</span>
      </div>
    </>
  );
};

export default Indicator;
