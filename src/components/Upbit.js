import { useState, useEffect } from "react";

const Upbit = () => {
  const [loading, setLoading] = useState(true);
  const [btc, setBtc] = useState([]);

  useEffect(() => {
    fetch("https://api.upbit.com/v1/ticker?markets=KRW-BTC")
      .then((response) => response.json())
      .then((json) => {
        setBtc(json);
        setLoading(false);
      });
  }, []);

  return (
    <div className="indicatorWrap">
      <h3>비트코인</h3>
      {loading ? (
        <strong>Loading...</strong>
      ) : (
        <>
          {btc.map((coin) => (
            <span key={coin.market}>
              {coin.trade_price
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              원
            </span>
          ))}
        </>
      )}
    </div>
  );
};

export default Upbit;
