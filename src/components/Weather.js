import { useEffect, useState } from "react";
import { faTemperatureLow } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Weather = () => {
  const API_KEY = process.env.REACT_APP_WEATHER;
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [res, setRes] = useState();

  useEffect(() => {
    if (city === "") {
      const { geolocation } = navigator;
      if (!geolocation) {
        onGeoError();
        return;
      }
      navigator.geolocation.getCurrentPosition(onGeoLocale, onGeoError);
    } else {
      selectCity();
    }
  }, [city]);

  const onChangeCity = (event) => {
    const {
      target: { value },
    } = event;
    setCity(value);
  };

  const selectCity = () => {
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}&lang=kr`
    )
      .then((response) => response.json())
      .then((data) => {
        setRes(data);
        setLoading(false);
      });
  };

  const onGeoLocale = (position) => {
    const { latitude, longitude } = position.coords;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=kr`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        setRes(data);
        setLoading(false);
      });
  };

  const onGeoError = () => {
    setCity("Seoul");
  };

  return (
    <>
      {loading ? (
        <strong>Loading...</strong>
      ) : (
        <>
          <div className="weather__city">
            <FontAwesomeIcon icon={faTemperatureLow} />
            <h3>실시간날씨</h3>
            <select value={city} onChange={onChangeCity}>
              <option value="Seoul">서울</option>
              <option value="Busan">부산</option>
              <option value="Incheon">인천</option>
              <option value="Daegu">대구</option>
              <option value="Daejeon">대전</option>
              <option value="Gwangju">광주</option>
              <option value="Suwon-si">수원</option>
              <option value="Ulsan">울산</option>
              <option value="Goyang-si">고양</option>
              <option value="Yongin">용인</option>
              <option value="yangsan">양산</option>
              <option value="Changwon">창원</option>
              <option value="Seongnam-si">성남</option>
              <option value="Cheongju-si">청주</option>
              <option value="Bucheon-si">부천</option>
              <option value="Hwaseong-si">화성</option>
              <option value="Jeonju">전주</option>
              <option value="Cheonan">천안</option>
              <option value="Ansan-si">안산</option>
              <option value="Anyang-si">안양</option>
              <option value="Gimhae">김해</option>
              <option value="Pyeongtaek-si">평택</option>
              <option value="Pohang">포항</option>
              <option value="Uijeongbu-si">의정부</option>
              <option value="Jeju City">제주</option>
            </select>
          </div>
          <span className="weather__icon">
            <img
              src={`https://openweathermap.org/img/wn/${res.weather[0].icon}.png`}
              alt={res.weather[0].description}
            />
          </span>
          <span className="weather__temp">{res.main.temp}°C</span>
          <span className="weather__desc">{res.weather[0].description}</span>
          <div className="weather__etc">
            <span>
              <i>습도</i>
              {res.main.humidity} %
            </span>
            <span>
              <i>바람</i>
              {res.wind.speed} m/s
            </span>
            <span>
              <i>구름</i>
              {res.clouds.all} %
            </span>
          </div>
        </>
      )}
    </>
  );
};

export default Weather;
