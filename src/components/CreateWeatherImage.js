import { useState, useRef } from "react";
import "../create.css";
import {
  Sun,
  SunCloud,
  Cloud,
  SunRainCloud,
  Shower,
  ShowerThunder,
  CloudSnowSun,
  SnowCloud,
  RainSnow,
  Snow,
} from "./WeatherIcons";

const WEATHER_ICONS = [
  { id: "sun", Component: Sun, url: "/images/sun.svg" },
  { id: "sun-cloud", Component: SunCloud, url: "/images/sun-cloud.svg" },
  { id: "cloud", Component: Cloud, url: "/images/cloud.svg" },
  { id: "sun-rain-cloud", Component: SunRainCloud, url: "/images/sun-rain-cloud.svg" },
  { id: "shower", Component: Shower, url: "/images/shower.svg" },
  { id: "shower-thunder", Component: ShowerThunder, url: "/images/shower-thunder.svg" },
  { id: "cloud-snow-sun", Component: CloudSnowSun, url: "/images/cloud-snow-sun.svg" },
  { id: "snow-cloud", Component: SnowCloud, url: "/images/snow-cloud.svg" },
  { id: "rain-snow", Component: RainSnow, url: "/images/rain-snow.svg" },
  { id: "snow", Component: Snow, url: "/images/snow.svg" },
];

const CreateWeatherImage = () => {
  const imgFileInput = useRef(null);
  const imgSelectedImage = useRef(null);
  const imgSubmitBtn = useRef(null);
  const imgContainer = useRef(null);
  const imgDownload = useRef(null);

  // Form state
  const [lowTemp, setLowTemp] = useState("");
  const [highTemp, setHighTemp] = useState("");
  const [url, setUrl] = useState("Weaco.co.kr");
  const [date, setDate] = useState(getToday());
  const [country, setCountry] = useState("S.Korea, Seoul");
  const [city, setCity] = useState("서울");

  // UI state
  const [selectedIcon, setSelectedIcon] = useState("sun");
  const [isDrag, setIsDrag] = useState(false);
  const [startY, setStartY] = useState(0);
  const [positionY, setPositionY] = useState(-100);
  const [resultCanvas, setResultCanvas] = useState(null);
  const [resultDownload, setResultDownload] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState("");
  const [backgroundSize, setBackgroundSize] = useState("cover");
  const [fileButtonText, setFileButtonText] = useState("Choose File");
  const [fileButtonStyle, setFileButtonStyle] = useState({});

  // Image dimensions
  const [editImg, setEditImg] = useState({ width: 500, height: 0 });
  const [eventY, setEventY] = useState({ start: 0, move: 0 });

  // Validation state
  const [inputErrors, setInputErrors] = useState({});

  function getToday() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const handleIconClick = (iconId) => {
    setSelectedIcon(selectedIcon === iconId ? null : iconId);
  };

  const getIconStyle = (iconId) => ({
    fill: selectedIcon === iconId ? "chartreuse" : "white",
    cursor: "pointer",
  });

  const handleDragStart = (e) => {
    if (imgSelectedImage.current) {
      imgSelectedImage.current.style.cursor = "grabbing";
    }
    setIsDrag(true);
    setStartY(e.clientY);
  };

  const handleDragEnd = () => {
    if (imgSelectedImage.current) {
      imgSelectedImage.current.style.cursor = "grab";
    }
    setIsDrag(false);
  };

  const handleDragMove = (e) => {
    if (isDrag) {
      setPositionY(positionY + (e.clientY - startY));
      setStartY(e.clientY);
    }
  };

  const validateInputs = () => {
    const errors = {};
    if (!imgFileInput.current?.files[0]) errors.file = true;
    if (!lowTemp) errors.lowTemp = true;
    if (!highTemp) errors.highTemp = true;
    if (!url) errors.url = true;
    if (!date) errors.date = true;
    if (!country) errors.country = true;
    if (!city) errors.city = true;
    setInputErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getInputStyle = (fieldName) => ({
    borderColor: inputErrors[fieldName] ? "red" : undefined,
  });

  const chooseFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      setFileButtonStyle({ backgroundColor: "chartreuse", color: "black" });

      img.onload = () => {
        const newEditImg = {
          width: 500,
          height: (500 * img.height) / img.width,
        };

        setEditImg(newEditImg);
        setBackgroundImage(`url(${reader.result})`);
        setBackgroundSize(img.height > img.width ? "cover" : "contain");

        const newEventY = {
          start: 0,
          move: img.width < img.height ? -100 : (500 - newEditImg.height) / 2,
        };
        setEventY(newEventY);
        setPositionY(newEventY.move);
        setFileButtonText("↻ Change File");

        if (imgSubmitBtn.current) {
          imgSubmitBtn.current.style.marginRight = 0;
        }
      };
    };
  };

  const handleCreateImage = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    // Clear previous results
    setResultCanvas(null);
    setResultDownload(null);

    const file = imgFileInput.current.files[0];
    const formattedDate = date.replaceAll("-", "");
    const selectedIconData = WEATHER_ICONS.find((icon) => icon.id === selectedIcon);
    const weatherIconUrl = selectedIconData?.url || "/images/sun.svg";

    const reader = new FileReader();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    let weatherIconBlob;
    try {
      const response = await fetch(weatherIconUrl);
      weatherIconBlob = await response.blob();
    } catch (error) {
      console.error("Failed to fetch weather icon:", error);
      return;
    }

    const reader2 = new FileReader();
    reader2.readAsDataURL(weatherIconBlob);

    reader.readAsDataURL(file);

    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      const iconImg = new Image();

      reader2.onload = () => {
        iconImg.src = reader2.result;
      };

      img.onload = async () => {
        const height50 = 48;
        const height100 = 97;
        canvas.width = 1000;
        canvas.height = 1000;
        ctx.fillStyle = "#19202C";
        ctx.fillRect(0, 0, 1000, 1000);

        const longImg = img.width <= img.height;
        let x = 0;
        let y = 0;

        if (longImg) {
          y = img.height === img.width ? 0 : (img.height / (editImg.height / eventY.move)) * -1;
          ctx.drawImage(img, x, y, img.width, img.width, 0, 0, 1000, 1000);
        } else {
          const canvasHeight = (1000 * img.height) / img.width;
          ctx.drawImage(img, x, y, img.width, img.height, 0, eventY.move * 2, 1000, canvasHeight);
        }

        ctx.font = "50px S-CoreDream-6Bold";
        ctx.fillStyle = "white";
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 16;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.textAlign = "right";
        ctx.fillText(url, 950, 42 + height50);

        // Draw weather icon
        if (iconImg.complete) {
          ctx.drawImage(iconImg, 50, 160);
        }

        ctx.font = "50px S-CoreDream-3Light";
        ctx.textAlign = "left";
        ctx.fillText(formattedDate.substring(0, 4), 60, 802 + height50);
        ctx.textAlign = "right";
        ctx.fillText(country, 950, 792 + height50);

        ctx.font = "90px S-CoreDream-3Light";
        ctx.textAlign = "left";
        const delim = 90 + Math.round(ctx.measureText(lowTemp).width);
        ctx.fillText("/", delim, 30 + height100);

        ctx.font = "100px S-CoreDream-6Bold";
        ctx.textAlign = "left";
        ctx.fillText(lowTemp + "°", 44, 35 + height100);
        ctx.fillText(highTemp + "°", 40 + ctx.measureText(lowTemp + "°/").width, 35 + height100);
        ctx.letterSpacing = "-1px";
        ctx.fillText(formattedDate.substring(4), 55, 856 + height100);
        ctx.textAlign = "right";
        ctx.fillText(city, 950, 846 + height100);

        setResultCanvas(canvas);
        addDownloadButton(canvas);
      };
    };
  };

  const addDownloadButton = (canvas) => {
    const downloadLink = (
      <a href={canvas.toDataURL("image/jpeg")} download={`${date}.jpg`}>
        <p>
          <span>File Name</span>
          {date}.jpg
        </p>
        <button className="btn btn-dark" type="button">
          Download
        </button>
      </a>
    );
    setResultDownload(downloadLink);
  };

  const clearInput = (setter) => (e) => {
    e.preventDefault();
    setter("");
  };

  return (
    <div className="create-image-container">
      <div className="container">
        <div className="temp-wrap">
          <div className="input-wrap">
            <label htmlFor="imgLowTemp">Lowest Temperature</label>
            <input
              type="text"
              id="imgLowTemp"
              placeholder="최저기온"
              maxLength="3"
              value={lowTemp}
              onChange={(e) => setLowTemp(e.target.value)}
              style={getInputStyle("lowTemp")}
            />
            <button className="clearBtn" onClick={clearInput(setLowTemp)} type="button">
              ✖
            </button>
          </div>
          <div className="input-wrap">
            <label htmlFor="imgHighTemp">Highest Temperature</label>
            <input
              type="text"
              id="imgHighTemp"
              placeholder="최고기온"
              maxLength="2"
              value={highTemp}
              onChange={(e) => setHighTemp(e.target.value)}
              style={getInputStyle("highTemp")}
            />
            <button className="clearBtn" onClick={clearInput(setHighTemp)} type="button">
              ✖
            </button>
          </div>
        </div>
        <div className="input-wrap url-wrap">
          <label htmlFor="imgUrl">Url</label>
          <input
            type="text"
            id="imgUrl"
            placeholder="Weaco.co.kr"
            maxLength="30"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={getInputStyle("url")}
          />
          <button className="clearBtn" onClick={clearInput(setUrl)} type="button">
            ✖
          </button>
        </div>

        <ul className="weather-icon-wrap">
          {WEATHER_ICONS.map(({ id, Component }) => (
            <li key={id} className="weather-icon">
              <Component
                className={id}
                onClick={() => handleIconClick(id)}
                style={getIconStyle(id)}
              />
            </li>
          ))}
        </ul>

        <div className="input-wrap icon-wrap">
          <label htmlFor="icon">Weather Icon</label>
          <input type="text" id="icon" value={selectedIcon || ""} readOnly />
        </div>
        <div className="input-wrap file-wrap">
          <label
            htmlFor="imgFileInput"
            className="btn"
            style={{
              ...fileButtonStyle,
              ...(inputErrors.file ? { backgroundColor: "red", color: "white" } : {}),
            }}
          >
            {fileButtonText}
          </label>
          <input
            type="file"
            ref={imgFileInput}
            id="imgFileInput"
            accept="image/*"
            onChange={chooseFile}
          />
        </div>
        <div className="input-wrap date-wrap">
          <label htmlFor="imgDateInput">Date</label>
          <input
            type="date"
            id="imgDateInput"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={getInputStyle("date")}
          />
        </div>
        <div className="city-wrap">
          <div className="input-wrap">
            <label htmlFor="imgCountry">Country</label>
            <input
              type="text"
              id="imgCountry"
              placeholder="S.Korea, Seoul"
              maxLength="30"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={getInputStyle("country")}
            />
            <button className="clearBtn" onClick={clearInput(setCountry)} type="button">
              ✖
            </button>
          </div>
          <div className="input-wrap">
            <label htmlFor="imgCity">City</label>
            <input
              type="text"
              id="imgCity"
              placeholder="서울"
              maxLength="20"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={getInputStyle("city")}
            />
            <button className="clearBtn" onClick={clearInput(setCity)} type="button">
              ✖
            </button>
          </div>
        </div>
        <div
          id="imgSelectedImage"
          ref={imgSelectedImage}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          style={{
            backgroundPositionY: positionY,
            backgroundImage: backgroundImage,
            backgroundSize: backgroundSize,
            backgroundColor: backgroundImage ? "#19202c" : undefined,
            cursor: backgroundImage ? "grab" : undefined,
          }}
        />
      </div>
      <div className="btn-wrap">
        <button
          id="imgSubmitBtn"
          ref={imgSubmitBtn}
          className="btn btn-dark"
          onClick={handleCreateImage}
          type="button"
        >
          Create
        </button>
      </div>
      <div className="result-wrap">
        <div id="imgContainer" ref={imgContainer}>
          {resultCanvas && (
            <canvas
              ref={(el) => {
                if (el && resultCanvas) {
                  const ctx = el.getContext("2d");
                  el.width = resultCanvas.width;
                  el.height = resultCanvas.height;
                  ctx.drawImage(resultCanvas, 0, 0);
                }
              }}
            />
          )}
        </div>
        <div id="imgDownload" ref={imgDownload}>
          {resultDownload}
        </div>
      </div>
    </div>
  );
};

export default CreateWeatherImage;
