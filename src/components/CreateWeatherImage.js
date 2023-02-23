import { useState, useEffect, useRef } from "react";
import "../create.css";

const CreateWeatherImage = ({}) => {
  const imgFileInput = useRef();
  const imgUrl = useRef();
  const imgLowTemp = useRef();
  const imgHighTemp = useRef();
  const imgDateInput = useRef();
  const imgCountry = useRef();
  const imgCity = useRef();
  const imgSelectedImage = useRef();
  const imgSubmitBtn = useRef();
  const imgContainer = useRef();
  const imgDownload = useRef();
  let imgIcons = "";
  let imgInputs = "";
  let imgWeatherUrl = "";

  useEffect(() => {
    imgIcons = document.querySelectorAll(".weather-icon");
    imgInputs = document.querySelectorAll(".create-image-container input");
    init();
    addClearIcon();
  }, []);

  useEffect(() => {
    // 날씨 아이콘을 선택하면, 선택된 아이콘의 색을 chartreuse로 변경한다.
    imgIcons.forEach((icon) =>
      icon.addEventListener("click", (e) => {
        if (e.target.style.fill === "chartreuse") {
          e.target.style.fill = "white";
          imgWeatherUrl = "";
          return;
        }
        if (e.target.tagName === "IMG" || e.target.tagName === "svg") {
          imgIcons.forEach((icon) => {
            icon.children[0].style.fill = "white";
          });
          e.target.style.fill = "chartreuse";
          imgWeatherUrl = "/images/" + e.target.className.baseVal + ".svg";
        }
      })
    );
  }, [imgWeatherUrl]);

  // 페이지 초기값 설정
  function init() {
    imgDateInput.current.value = getToday();
    imgUrl.current.value = "Weaco.co.kr";
    imgWeatherUrl = "../../public/sun.svg";
    document.querySelector(".sun").style.fill = "chartreuse";
    imgCity.current.value = "서울";
    imgCountry.current.value = "S.Korea, Seoul";
  }

  // 오늘 날짜를 yyyy-mm-dd 형식으로 반환하는 함수
  function getToday() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm =
      today.getMonth() < 9
        ? "0" + (today.getMonth() + 1)
        : today.getMonth() + 1;
    const dd = today.getDate() < 10 ? "0" + today.getDate() : today.getDate();
    return `${yyyy}-${mm}-${dd}`;
  }

  // imgInput 요소에 clear 버튼을 추가한다.
  function addClearIcon() {
    imgInputs.forEach((imgInput) => {
      const deleteButton = document.createElement("button");
      deleteButton.innerHTML = "✖";
      deleteButton.className = "clearBtn";
      if (imgInput.id === "imgFileInput" || imgInput.id === "imgDateInput")
        return; // fileInput은 삭제버튼을 추가하지 않는다.
      imgInput.insertAdjacentElement("afterend", deleteButton); // imgInput element에 deleteButton을 추가한다.
      deleteButton.addEventListener("click", () => {
        imgInput.value = "";
      });
    });
  }

  // imgInput null check
  function inputNullCheck() {
    if (!imgFileInput.current.files[0]) {
      imgFileInput.current.previousElementSibling.style.backgroundColor = "red";
      imgFileInput.current.previousElementSibling.style.color = "white";
    }
    imgInputs.forEach((imgInput) => checkValue(imgInput));
  }

  function checkValue(imgInput) {
    if (imgInput.value === "") {
      imgInput.focus();
      imgInput.style.borderColor = "red";
    } else {
      imgInput.style.borderColor = "chartreuse";
    }
  }

  let originImg = {
    width: 0,
    height: 0,
  };
  let editImg = {
    width: 500,
    height: 0,
  };
  let eventY = {
    drag: false,
    start: 0,
    move: 0,
  };

  function chooseFile(event) {
    // initialize
    imgSelectedImage.current.style.backgroundColor = "";
    imgSelectedImage.current.innerHTML = "";

    let file = event.target.files[0];
    console.log(`originalFile size ${file.size / 1024 / 1024} MB`);

    const img = new Image();
    img.src = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      imgFileInput.current.previousElementSibling.style.backgroundColor =
        "chartreuse";
      imgFileInput.current.previousElementSibling.style.color = "black";
      imgSelectedImage.current.style.backgroundColor = "#19202c";

      img.onload = () => {
        originImg.width = img.width;
        originImg.height = img.height;
        editImg.height = (editImg.width * img.height) / img.width;

        imgSelectedImage.current.style.backgroundImage = `url(${reader.result})`;
        imgSelectedImage.current.style.backgroundSize =
          originImg.height > originImg.width ? "cover" : "contain";

        eventY.start = img.getBoundingClientRect().top;
        eventY.move =
          img.width < img.height ? -100 : (editImg.width - editImg.height) / 2;
        imgSelectedImage.current.style.backgroundPositionY = `${eventY.move}px`;

        imgFileInput.current.previousElementSibling.innerText = "↻ Change File";
        imgFileInput.current.previousElementSibling.style.position = "absolute";
        imgFileInput.current.previousElementSibling.style.bottom = "-67px";
        imgFileInput.current.parentElement.style.zIndex = "0";

        imgSubmitBtn.current.style.marginRight = 0;
      };
    };
  }

  // 이미지 실시간 드래그로 위치 조정
  function dragImage() {
    imgSelectedImage.current.addEventListener("mousedown", mouseDown);
    imgSelectedImage.current.addEventListener("mousemove", mouseMove);
    imgSelectedImage.current.addEventListener("mouseup", mouseUp);
  }

  function mouseMove(e) {
    if (eventY.drag) {
      let currunt =
        parseInt(
          imgSelectedImage.current.style.backgroundPositionY.replace("px", "")
        ) + e.movementY;
      imgSelectedImage.current.style.backgroundPositionY = currunt + "px";
      eventY.move = currunt;
    }
  }

  function mouseDown(e) {
    eventY.drag = true;
    eventY.start = e.clientY;
    imgSelectedImage.current.style.cursor = "grabbing";
  }

  function mouseUp(e) {
    eventY.drag = false;
    imgSelectedImage.current.style.cursor = "grab";
  }

  async function submit() {
    // initialize canvas.
    imgContainer.current.innerHTML = "";
    imgDownload.current.innerHTML = "";
    inputNullCheck();

    const low = imgLowTemp.current.value;
    const high = imgHighTemp.current.value;
    const file = imgFileInput.current.files[0];
    const date = imgDateInput.current.value.replaceAll("-", "");

    const reader = new FileReader();
    const reader2 = new FileReader();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const weatherIcon = await fetch(imgWeatherUrl).then((response) =>
      response.blob()
    );

    reader.readAsDataURL(file);
    reader2.readAsDataURL(weatherIcon);

    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      const iconImg = new Image();
      iconImg.src = reader2.result;

      img.onload = async () => {
        const height50 = 48;
        const height100 = 97;
        canvas.width = 1000;
        canvas.height = 1000;
        ctx.fillStyle = "#19202C";
        ctx.fillRect(0, 0, 1000, 1000);
        let longImg = img.width <= img.height;
        let x = 0;
        let y = 0;
        if (longImg) {
          y =
            img.height === img.width
              ? 0
              : (img.height / (editImg.height / eventY.move)) * -1;
          // (4032 / (3024 / 1000)) * -1 = 1.333
          ctx.drawImage(img, x, y, img.width, img.width, 0, 0, 1000, 1000);
        } else {
          // original width : original height = width resize : height resize
          // height resize = (width resize * original height) / original width
          let canvasHeight = (1000 * img.height) / img.width;
          ctx.drawImage(
            img,
            x,
            y,
            img.width,
            img.height,
            0,
            eventY.move * 2,
            1000,
            canvasHeight
          );
        }

        ctx.font = "50px S-CoreDream-6Bold";
        ctx.fillStyle = "white";
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 16;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.textAlign = "right";
        imgUrl.current &&
          ctx.fillText(imgUrl.current.value, 950, 42 + height50);

        // 날씨 아이콘을 추가한다.
        iconImg && ctx.drawImage(iconImg, 50, 160);

        ctx.font = "50px S-CoreDream-3Light";
        ctx.textAlign = "left";
        date && ctx.fillText(date.substring(0, 4), 60, 802 + height50);
        ctx.textAlign = "right";
        imgCountry.current &&
          ctx.fillText(imgCountry.current.value, 950, 792 + height50);

        ctx.font = "90px S-CoreDream-3Light";
        ctx.textAlign = "left";
        let delim = 90 + Math.round(ctx.measureText(low).width);
        low && high && ctx.fillText("/", delim, 30 + height100);

        ctx.font = "100px S-CoreDream-6Bold";
        ctx.textAlign = "left";
        low && ctx.fillText(low + "°", 44, 35 + height100);
        high &&
          ctx.fillText(
            high + "°",
            40 + ctx.measureText(low + "°/").width,
            35 + height100
          );
        ctx.letterSpacing = "-1px";
        date && ctx.fillText(date.substring(4), 55, 856 + height100);
        ctx.textAlign = "right";
        imgCity.current &&
          ctx.fillText(imgCity.current.value, 950, 846 + height100);

        imgContainer.current.appendChild(canvas);
        addDownloadButton(canvas);
      };
    };
  }

  function addDownloadButton(canvas) {
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/jpeg");
    a.download = `${imgDateInput.current.value}.jpg`;
    a.innerHTML = `<p><span>File Name</span>${imgDateInput.current.value}.jpg</p>`;
    const button = document.createElement("button");
    button.innerText = "Download";
    button.className = "btn btn-dark";
    a.appendChild(button);
    imgDownload.current.appendChild(a);
  }

  return (
    <div className="create-image-container">
      <div className="container">
        <div className="temp-wrap">
          <div className="input-wrap">
            <label htmlFor="imgLowTemp">Lowest Temperature</label>
            <input
              type="text"
              id="imgLowTemp"
              ref={imgLowTemp}
              placeholder="최저기온"
              maxLength="3"
            />
          </div>
          <div className="input-wrap">
            <label htmlFor="imgHighTemp">Highest Temperature</label>
            <input
              type="text"
              id="imgHighTemp"
              ref={imgHighTemp}
              placeholder="최고기온"
              maxLength="2"
            />
          </div>
        </div>
        <div className="input-wrap url-wrap">
          <label htmlFor="imgUrl">Url</label>
          <input
            type="text"
            id="imgUrl"
            ref={imgUrl}
            placeholder="Weaco.co.kr"
            maxLength="30"
          />
        </div>
        <ul className="weather-icon-wrap">
          <li className="weather-icon">
            <svg
              className="sun"
              width="207"
              height="207"
              viewBox="0 0 207 207"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M176.171 110.106V96.893H207.001V110.106H176.171ZM150.215 47.443L172.015 25.642L181.358 34.985L159.558 56.785L150.215 47.443ZM103.5 162.958C70.662 162.958 44.042 136.338 44.042 103.5C44.042 70.663 70.662 44.042 103.5 44.042C136.338 44.042 162.958 70.663 162.958 103.5C162.958 136.338 136.338 162.958 103.5 162.958ZM103.5 57.255C77.96 57.255 57.255 77.96 57.255 103.5C57.255 129.04 77.96 149.745 103.5 149.745C129.041 149.745 149.745 129.04 149.745 103.5C149.745 77.96 129.041 57.255 103.5 57.255ZM96.894 -0.000976562H110.106V30.829H96.894V-0.000976562ZM25.643 34.985L34.985 25.642L56.785 47.443L47.443 56.785L25.643 34.985ZM30.829 110.106H-0.000976562V96.893H30.829V110.106ZM56.785 159.558L34.985 181.358L25.643 172.015L47.443 150.215L56.785 159.558ZM110.106 207.001H96.894V176.171H110.106V207.001ZM181.358 172.015L172.015 181.358L150.215 159.558L159.558 150.215L181.358 172.015Z"
              />
            </svg>
          </li>
          <li className="weather-icon">
            <svg
              className="sun-cloud"
              width="220"
              height="181"
              viewBox="0 0 220 181"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M192.5 86.566V74.761H220V86.566H192.5ZM172.799 38.928L192.245 19.452L200.578 27.799L181.133 47.275L172.799 38.928ZM164.262 113.615C161.495 110.61 158.356 107.967 154.898 105.762C163.306 100.567 168.929 91.285 168.929 80.663C168.929 64.365 155.737 51.152 139.464 51.152C128.85 51.152 119.574 56.793 114.388 65.226C110.78 63.555 107.002 62.213 103.081 61.203C110.029 48.2 123.71 39.348 139.464 39.348C162.246 39.348 180.714 57.845 180.714 80.663C180.714 94.146 174.244 106.085 164.262 113.615ZM133.571 0H145.357V27.544H133.571V0ZM78.35 27.799L86.684 19.452L106.129 38.928L97.795 47.275L78.35 27.799ZM139.485 111.593C154.218 115.866 165 129.454 165 145.587C165 165.145 149.17 181 129.643 181H39.286C17.589 181 0 163.383 0 141.652C0 120.785 16.231 103.758 36.73 102.434C45.538 83.77 64.45 70.826 86.429 70.826C111.85 70.826 133.183 88.125 139.485 111.593ZM44.743 114.655C42.979 114.299 41.155 114.109 39.286 114.109C24.098 114.109 11.786 126.44 11.786 141.652C11.786 156.864 24.098 169.196 39.286 169.196H129.643C142.661 169.196 153.214 158.626 153.214 145.587C153.214 132.548 142.661 121.978 129.643 121.978C129.575 121.978 129.513 121.997 129.446 121.998C127.467 99.931 108.975 82.631 86.429 82.631C66.457 82.631 49.697 96.219 44.743 114.655ZM200.578 133.527L192.245 141.874L172.799 122.398L181.133 114.051L200.578 133.527Z"
              />
            </svg>
          </li>
          <li className="weather-icon">
            <svg
              className="cloud"
              width="220"
              height="148"
              viewBox="0 0 220 148"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M177.692 148H50.769V147.758C49.371 147.885 47.97 148 46.539 148C20.836 148 0 127.175 0 101.486C0 75.797 20.836 54.972 46.539 54.972C47.075 54.972 47.595 55.034 48.126 55.052C54.891 23.592 82.849 0 116.346 0C153.03 0 183.043 28.298 185.874 64.235C205.322 68.046 220 85.16 220 105.714C220 129.069 201.058 148 177.692 148ZM177.692 76.114C176.074 76.114 174.498 76.279 172.95 76.529C173.216 74.303 173.462 72.07 173.462 69.771C173.462 38.244 147.89 12.686 116.346 12.686C84.802 12.686 59.231 38.244 59.231 69.771C59.231 69.898 59.249 70.02 59.25 70.147C55.323 68.553 51.038 67.657 46.539 67.657C27.846 67.657 12.692 82.803 12.692 101.486C12.692 120.169 27.846 135.315 46.539 135.315C47.979 135.315 49.377 135.15 50.769 134.975V135.315H177.692C194.048 135.315 207.307 122.062 207.307 105.714C207.307 89.367 194.048 76.114 177.692 76.114Z"
              />
            </svg>
          </li>
          <li className="weather-icon">
            <svg
              className="sun-rain-cloud"
              width="220"
              height="220"
              viewBox="0 0 220 220"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M192.5 86.429V74.643H220V86.429H192.5ZM172.799 38.867L192.245 19.421L200.579 27.755L181.133 47.201L172.799 38.867ZM164.262 113.436C161.495 110.436 158.356 107.797 154.898 105.595C163.306 100.408 168.929 91.141 168.929 80.536C168.929 64.263 155.737 51.072 139.464 51.072C128.85 51.072 119.575 56.703 114.388 65.123C110.78 63.455 107.002 62.115 103.081 61.107C110.029 48.124 123.71 39.286 139.464 39.286C162.246 39.286 180.715 57.754 180.715 80.536C180.715 93.998 174.244 105.917 164.262 113.436ZM133.571 0H145.357V27.5H133.571V0ZM78.35 27.755L86.684 19.421L106.129 38.867L97.796 47.201L78.35 27.755ZM139.485 111.417C154.218 115.683 165 129.249 165 145.357C165 160.746 155.152 173.801 141.429 178.66V165.66C148.445 161.576 153.214 154.06 153.214 145.357C153.214 132.34 142.661 121.786 129.643 121.786C129.575 121.786 129.513 121.805 129.446 121.806C127.467 99.774 108.976 82.5 86.429 82.5C66.457 82.5 49.697 96.068 44.744 114.474C42.979 114.119 41.155 113.929 39.286 113.929C24.098 113.929 11.786 126.241 11.786 141.429C11.786 150.77 16.453 159.009 23.571 163.979V177.424C9.702 171.359 0 157.535 0 141.429C0 120.594 16.231 103.595 36.731 102.272C45.538 83.638 64.45 70.715 86.429 70.715C111.85 70.715 133.183 87.986 139.485 111.417ZM47.143 172.858H35.357V149.286H47.143V172.858ZM47.143 208.214H35.357V184.643H47.143V208.214ZM74.643 184.643H62.858V161.072H74.643V184.643ZM74.643 220.001H62.858V196.429H74.643V220.001ZM102.143 172.858H90.357V149.286H102.143V172.858ZM102.143 208.214H90.357V184.643H102.143V208.214ZM129.643 184.643H117.857V161.072H129.643V184.643ZM129.643 220.001H117.857V196.429H129.643V220.001ZM200.579 133.316L192.245 141.65L172.799 122.205L181.133 113.871L200.579 133.316Z"
              />
            </svg>
          </li>
          <li className="weather-icon">
            <svg
              className="shower"
              width="223"
              height="184"
              viewBox="0 0 223 184"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M180.115 149.768C179.167 149.768 178.242 149.672 177.309 149.611L181.57 136.858C197.468 136.096 210.135 123.031 210.135 106.977C210.135 90.434 196.695 77.024 180.115 77.024C178.514 77.024 176.954 77.185 175.42 77.426C175.685 75.189 175.827 72.914 175.827 70.605C175.827 38.701 149.907 12.838 117.933 12.838C85.959 12.838 60.039 38.701 60.039 70.605C60.039 70.733 60.057 70.857 60.058 70.985C56.077 69.373 51.734 68.466 47.173 68.466C28.226 68.466 12.866 83.793 12.866 102.698C12.866 121.604 28.226 136.931 47.173 136.931C47.673 136.931 48.147 136.834 48.642 136.814L44.362 149.626C19.625 148.168 0 127.747 0 102.698C0 76.702 21.12 55.629 47.173 55.629C47.716 55.629 48.244 55.692 48.782 55.71C55.64 23.875 83.978 0 117.933 0C155.117 0 185.539 28.636 188.409 65.003C208.122 68.86 223 86.178 223 106.977C223 130.61 203.8 149.768 180.115 149.768ZM85.77 106.977L64.327 171.163H51.462L72.904 106.977H85.77ZM111.5 119.815L90.058 184H77.192L98.635 119.815H111.5ZM145.808 106.977L124.366 171.163H111.5L132.943 106.977H145.808ZM171.539 119.815L150.096 184H137.231L158.674 119.815H171.539Z"
              />
            </svg>
          </li>
          <li className="weather-icon">
            <svg
              className="shower-thunder"
              width="223"
              height="202"
              viewBox="0 0 223 202"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M189.035 149.481L194.826 133.522C203.923 128.354 210.135 118.677 210.135 107.448C210.135 90.832 196.694 77.363 180.115 77.363C178.467 77.363 176.88 77.592 175.303 77.848C175.578 75.566 175.827 73.273 175.827 70.915C175.827 38.871 149.907 12.894 117.933 12.894C85.959 12.894 60.039 38.871 60.039 70.915C60.039 71.044 60.057 71.168 60.058 71.297C56.077 69.678 51.733 68.767 47.173 68.767C28.226 68.767 12.865 84.161 12.865 103.15C12.865 109.331 14.515 115.117 17.365 120.13L8.01 129.505C2.954 121.975 0 112.909 0 103.15C0 77.04 21.12 55.873 47.173 55.873C47.716 55.873 48.244 55.937 48.783 55.955C55.64 23.98 83.979 0.000976562 117.933 0.000976562C155.117 0.000976562 185.539 28.762 188.409 65.289C208.122 69.162 223 86.557 223 107.448C223 128.117 208.436 145.366 189.035 149.481ZM90.058 116.043H120.077L51.462 202.001V137.533H21.442L90.058 55.873V116.043ZM77.192 90.256L47.173 124.639H64.327V167.618L94.346 128.937H77.192V90.256ZM111.5 159.022L102.923 184.809H90.058L98.634 159.022H111.5ZM158.673 107.448L137.231 171.916H124.365L145.808 107.448H158.673ZM184.404 120.341L162.962 184.809H150.096L171.539 120.341H184.404Z"
              />
            </svg>
          </li>
          <li className="weather-icon">
            <svg
              className="cloud-snow-sun"
              width="220"
              height="219"
              viewBox="0 0 220 219"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M192.5 86.429V74.643H220V86.429H192.5ZM172.799 38.867L192.245 19.421L200.579 27.755L181.133 47.201L172.799 38.867ZM164.262 113.436C161.495 110.436 158.356 107.797 154.898 105.595C163.306 100.408 168.929 91.141 168.929 80.536C168.929 64.263 155.737 51.072 139.464 51.072C128.85 51.072 119.575 56.703 114.388 65.123C110.78 63.455 107.002 62.115 103.081 61.107C110.029 48.124 123.71 39.286 139.464 39.286C162.246 39.286 180.715 57.754 180.715 80.536C180.715 93.998 174.244 105.917 164.262 113.436ZM133.571 0H145.357V27.5H133.571V0ZM78.35 27.755L86.684 19.421L106.129 38.867L97.796 47.201L78.35 27.755ZM139.485 111.417C154.218 115.683 165 129.249 165 145.357C165 160.746 155.152 173.801 141.429 178.66V165.66C148.445 161.576 153.214 154.06 153.214 145.357C153.214 132.34 142.661 121.786 129.643 121.786C129.575 121.786 129.513 121.805 129.446 121.806C127.467 99.774 108.976 82.5 86.429 82.5C66.457 82.5 49.697 96.068 44.744 114.474C42.979 114.119 41.155 113.929 39.286 113.929C24.098 113.929 11.786 126.241 11.786 141.429C11.786 150.77 16.453 159.009 23.571 163.979V177.424C9.702 171.359 0 157.535 0 141.429C0 120.594 16.231 103.595 36.731 102.272C45.538 83.638 64.45 70.715 86.429 70.715C111.85 70.715 133.183 87.986 139.485 111.417ZM44.2 157.8L51.4 150.6L69.4 168.6H76.6V161.4L58.6 143.4L65.8 136.2L76.6 150.6V129H87.4V150.6L98.2 136.2L105.4 143.4L87.4 161.4V168.6H94.6L112.6 150.6L119.8 157.8L105.4 168.6H127V179.4H105.4L119.8 190.2L112.6 197.4L94.6 179.4H87.4V186.6L105.4 204.6L98.2 211.8L87.4 197.4V219H76.6V197.4L65.8 211.8L58.6 204.6L76.6 186.6V179.4H69.4L51.4 197.4L44.2 190.2L58.6 179.4H37V168.6H58.6L44.2 157.8ZM200.579 133.316L192.245 141.65L172.799 122.205L181.133 113.871L200.579 133.316Z"
              />
            </svg>
          </li>
          <li className="weather-icon">
            <svg
              className="snow-cloud"
              width="213"
              height="175"
              viewBox="0 0 213 175"
              fill="white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M172.038 142.442V130.233C187.874 130.233 200.712 117.479 200.712 101.744C200.712 86.011 187.874 73.256 172.038 73.256C170.494 73.256 168.99 73.412 167.512 73.645C167.766 71.511 167.942 69.354 167.942 67.151C167.942 36.808 143.185 12.21 112.644 12.21C82.104 12.21 57.346 36.808 57.346 67.151C57.346 67.273 57.364 67.391 57.365 67.512C53.562 65.979 49.414 65.117 45.058 65.117C26.96 65.117 12.289 79.694 12.289 97.675C12.289 115.656 26.96 130.233 45.058 130.233V142.442C20.173 142.442 0 122.399 0 97.675C0 72.951 20.173 52.907 45.058 52.907C45.577 52.907 46.08 52.967 46.595 52.984C53.145 22.707 80.213 0.000976562 112.644 0.000976562C148.16 0.000976562 177.219 27.235 179.96 61.823C198.789 65.491 213 81.962 213 101.744C213 124.221 194.661 142.442 172.038 142.442ZM49.154 130.233H45.058C46.453 130.233 47.805 130.075 49.154 129.907V130.233ZM65.539 105.814L73.731 97.675L94.212 118.024H102.404V109.884L81.923 89.535L90.115 81.395L102.404 97.675V73.256H114.692V97.675L126.981 81.395L135.173 89.535L114.692 109.884V118.024H122.885L143.365 97.675L151.558 105.814L135.173 118.024H159.75V130.233H135.173L151.558 142.442L143.365 150.582L122.885 130.233H114.692V138.373L135.173 158.721L126.981 166.861L114.692 150.582V175H102.404V150.582L90.115 166.861L81.923 158.721L102.404 138.373V130.233H94.212L73.731 150.582L65.539 142.442L81.923 130.233H57.346V118.024H81.923L65.539 105.814Z"
              />
            </svg>
          </li>
          <li className="weather-icon">
            <svg
              className="rain-snow"
              width="206"
              height="186"
              viewBox="0 0 206 186"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M186.192 133.174V118.284C191.081 113.289 194.115 106.474 194.115 98.936C194.115 83.637 181.7 71.234 166.385 71.234C164.882 71.234 163.436 71.446 161.998 71.676C162.249 69.581 162.423 67.462 162.423 65.298C162.423 35.792 138.479 11.873 108.942 11.873C79.406 11.873 55.462 35.792 55.462 65.298C55.462 65.417 55.479 65.531 55.479 65.649C51.802 64.158 47.79 63.32 43.577 63.32C26.074 63.32 11.885 77.494 11.885 94.979C11.885 102.714 14.669 109.794 19.281 115.293L10.877 123.688C4.127 116.021 0 105.992 0 94.979C0 70.937 19.51 51.447 43.577 51.447C44.079 51.447 44.566 51.506 45.064 51.522C51.398 22.08 77.577 0.000976562 108.942 0.000976562C143.291 0.000976562 171.395 26.484 174.046 60.117C192.256 63.684 206 79.7 206 98.936C206 113.576 198.022 126.328 186.192 133.174ZM31.692 118.724L39.616 110.809L59.423 130.596H67.346V122.681L47.539 102.894L55.462 94.979L67.346 110.809V87.064H79.231V110.809L91.115 94.979L99.039 102.894L79.231 122.681V130.596H87.154L106.962 110.809L114.885 118.724L99.039 130.596H122.808V142.469H99.039L114.885 154.341L106.962 162.256L87.154 142.469H79.231V150.384L99.039 170.171L91.115 178.086L79.231 162.256V186H67.346V162.256L55.462 178.086L47.539 170.171L67.346 150.384V142.469H59.423L39.616 162.256L31.692 154.341L47.539 142.469H23.769V130.596H47.539L31.692 118.724ZM146.577 126.639H134.692V102.894H146.577V126.639ZM146.577 162.256H134.692V138.511H146.577V162.256ZM174.308 138.511H162.423V114.766H174.308V138.511ZM174.308 174.128H162.423V150.384H174.308V174.128Z"
              />
            </svg>
          </li>
          <li className="weather-icon">
            <svg
              className="snow"
              width="201"
              height="184"
              viewBox="0 0 201 184"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M201 99.741H168.807L185.674 120.384L177.944 133.285L146.537 99.741H113.89L130.169 127.974L174.963 138.456L167.669 151.61L141.308 147.292L157.445 175.281L144.055 183.021L127.966 155.117L118.573 179.993L103.549 179.74L116.834 135.812L100.5 107.482L84.255 135.657L97.587 179.74L82.563 179.993L73.117 154.975L56.945 183.021L43.555 175.281L59.678 147.317L33.467 151.61L26.173 138.455L70.81 128.011L87.11 99.741H54.599L23.193 133.285L15.462 120.384L32.329 99.741H0V84.259H32.329L15.462 63.617L23.193 50.715L54.599 84.259H87.11L70.809 55.989L26.173 45.545L33.467 32.39L59.678 36.684L43.555 8.72098L56.945 0.97998L73.117 29.027L82.563 4.00698L97.587 4.25998L84.255 48.345L100.5 76.519L116.834 48.19L103.549 4.25998L118.573 4.00698L127.966 28.884L144.055 0.97998L157.445 8.72098L141.308 36.709L167.669 32.39L174.963 45.545L130.169 56.026L113.89 84.259H146.538L177.944 50.715L185.674 63.617L168.808 84.259H201V99.741Z"
              />
            </svg>
          </li>
        </ul>
        <div className="input-wrap icon-wrap">
          <label htmlFor="icon">Weather Icon</label>
          <input type="text" id="icon" />
        </div>
        <div className="input-wrap file-wrap">
          <label htmlFor="imgFileInput" className="btn">
            Choose File
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
          <input type="date" id="imgDateInput" ref={imgDateInput} />
        </div>
        <div className="city-wrap">
          <div className="input-wrap">
            <label htmlFor="imgCountry">Country</label>
            <input
              type="text"
              id="imgCountry"
              ref={imgCountry}
              placeholder="S.Korea, Seoul"
              maxLength="30"
            />
          </div>
          <div className="input-wrap">
            <label htmlFor="imgCity">City</label>
            <input
              type="text"
              id="imgCity"
              ref={imgCity}
              placeholder="서울"
              maxLength="20"
            />
          </div>
        </div>
        <div
          id="imgSelectedImage"
          ref={imgSelectedImage}
          onDrag={dragImage}
        ></div>
      </div>
      <div className="btn-wrap">
        <button
          id="imgSubmitBtn"
          ref={imgSubmitBtn}
          className="btn btn-dark"
          onClick={submit}
        >
          Create
        </button>
      </div>
      <div className="result-wrap">
        <div id="imgContainer"></div>
        <div id="imgDownload"></div>
      </div>
    </div>
  );
};

export default CreateWeatherImage;
