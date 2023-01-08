import { storageService, dbService } from "fbase";
import imageCompression from 'browser-image-compression';
import { useState } from "react";
import { uuidv4 } from "@firebase/util";

const ImageCompressior = () => {
  const [ext, setExt] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(300);
  
  const doc = 'S9nPnnJhejVZ2HJsVVmYaTxTB732';
  const oldDoc = 'Vf46gZOvLVagkCQbvZxSqXyjrDu1';
  const ref = storageService.ref();

  // 이미지 다운로드
  const handleImageDownload = () => {
    console.log('이미지 다운로드 시작');
    dbService
      .collection("items")
      .where("creatorId", "==", process.env.REACT_APP_ADMIN)
      .where("date", ">=", startDate)
      .where("date", "<=", endDate)
      .orderBy("date", "desc")
      .get()
      .then((snapshot) => {
        console.log('이미지 갯수: ', snapshot.docs.length);
        snapshot.docs.map((doc) => {
          download(doc.data().attachmentUrl, doc.data().date);
        });
      });    
  }

  async function download(url, date) {
    console.log(`이미지 호출 : ${date}`);
    const init = await fetch(url, {method: "get"});
    const blob = await init.blob();
    let fileName = `${date}.jpg`;
    const createdUrl = URL.createObjectURL(await blob);
    const a = document.createElement("a");
    a.href = createdUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function getItems() {
    let count = 0;
    const items = [];
    return await new Promise((resolve) => {
      dbService
        .collection("items")
        .where("creatorId", "==", process.env.REACT_APP_ADMIN)
        .where("date", ">=", startDate)
        .where("date", "<=", endDate)
        .orderBy("date", "desc")
        .get()
        .then((snapshot) => {
          snapshot.docs.forEach((doc) => {
            count++;
            items.push({
              num: count, 
              id: doc.id, 
              date: doc.data().date, 
              url: doc.data().attachmentUrl, 
              thumbnailUrl: doc.data().thumbnailUrl
            });
          });
          resolve(items);
        })
        .catch((error) => {
          console.log("Error getting documents: ", error);
        });
      });
  }

  // 이미지 압축하기
  const handleImageCompression = async () => {
    console.log('========= 이미지 압축시작');

    let items = await getItems();
    console.log('전체 아이템: ',items)

    items.forEach(async (item) => {
      console.log('업데이트 호출 시작: ', item);
      updateImage(item.id, item.url, item.thumbnailUrl);
    });
  }

  async function updateImage(docId, url, thumbnailUrl) {
    let mainRef = await storageService.refFromURL(url);
    let thumbRef = "";
    if (thumbnailUrl !== "" && thumbnailUrl !== undefined) {
      thumbRef = await storageService.refFromURL(thumbnailUrl);
    } 

    if (mainRef.name.indexOf('.') > 0) {
      let ext = mainRef.name.split('.');
      setExt(ext[ext.length - 1]);
    }

    const init = await fetch(url, {method: "get"});
    const blob = await init.blob();
    compressedFile(blob, mainRef.name, thumbRef.name, docId);
  }

  async function compressedFile(blob, originFileName, thumbFileName, docId) {
    console.log(`originalFile size ${blob.size / 1024 / 1024} MB`);
    console.log('원본 파일 이름: ', originFileName);

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1000,
      useWebWorker: true,
      initialQuality: 0.7
    }
    try {
      const compressedFile = await imageCompression(blob, options);
      console.log(`compressedFile size ${compressedFile.size / 1024 / 1024} MB`);

      let thumbnailFile = await getThumbnailFile(compressedFile);
      console.log('썸네일 파일: ', thumbnailFile);

      let res = await Promise.all([
        ref.child(`${doc}/${originFileName}`).delete()
        .then(() => {
          console.log(originFileName + ' 1차 삭제 완료');
        })
        .catch((error) => {
          console.log('1차 삭제 실패: ', error);
          ref.child(`${oldDoc}/${originFileName}`).delete().then(() => {
            console.log(originFileName + ' 2차 삭제 완료');
          }).catch((error) => {
            console.log('2차 삭제 실패: ', error);;
          });
        }),

        ref.child(`thumbnails/${thumbFileName}`).delete()
        .then(() => {
          console.log(thumbFileName + ' 썸네일 삭제 완료');
        })
        .catch((error) => {
          console.log('썸네일 삭제 실패: ', error);
        }),

        ref.child(`${doc}/${uuidv4()}${ext ? '.'+ext : '.jpg'}`).put(compressedFile)
        .then((snapshot) => {
          return snapshot.ref.getDownloadURL();
        }).catch((error) => {
          console.log('재업로드 실패: ', error);
        }),

        ref.child(`thumbnails/${uuidv4()}.webp`).put(thumbnailFile)
        .then((snapshot) => {
          return snapshot.ref.getDownloadURL();
        }).catch((error) => {
          console.log('썸네일 재업로드 실패: ', error);
        })
      ]);

      console.log(res);

      updateAttachmentUrl(docId, res[2], res[3]);
      
    } catch (error) {
      console.log(error);
    }
  }

  async function getThumbnailFile(blob) {
    const reader = new FileReader();
    return await new Promise((resolve) => {
      reader.onloadend = (finishedEvent) => {
        const {
          currentTarget: { result },
        } = finishedEvent;
        const image = new Image();
        image.src = result;
        image.onload = function () {
          const canvas = document.createElement("canvas");
          canvas.width = 300;
          canvas.height = 300;
          canvas.getContext("2d").drawImage(image, 0, 0, 300, 300);
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/webp', 0.7);
        }
      }
      reader.readAsDataURL(blob);  
    })
    
  }

  async function updateAttachmentUrl(docId, url, thumbnailUrl) {
    dbService.doc(`items/${docId}`).update({
      attachmentUrl: url,
      thumbnailUrl: thumbnailUrl,
    });
    console.log('======== 업데이트 완료. 변경 파일 URL: ', url, thumbnailUrl);
  } 

  // 기존 데이터에 썸네일 이미지 없는 경우 썸네일 이미지 만들어 추가하기
  const handleCreateThumbnail = async () => {
    console.log('========= 썸네일 이미지 추가하기 시작');
    let items = await getItems();
    console.log('전체 아이템: ',items)

    items.forEach(async (item) => {
      console.log('업데이트 호출 시작: ', item);
      if (!item.thumbnailUrl) {
        updateThumbnail(item.id, item.url);
      }
    });
  }

  async function updateThumbnail(docId, url) {
    let mainRef = await storageService.refFromURL(url);
    const init = await fetch(url, {method: "get"});
    const blob = await init.blob();
    createThumbnail(blob, mainRef.name, docId);
  }

  async function createThumbnail(blob, originFileName, docId) {
    console.log('원본 파일 이름: ', originFileName);

    try {
      let thumbnailFile = await getThumbnailFile(blob);
      console.log('썸네일 파일: ', thumbnailFile);

      let res = await new Promise((resolve) => {
        ref.child(`thumbnails/${uuidv4()}.webp`).put(thumbnailFile)
        .then((snapshot) => {
          resolve(snapshot.ref.getDownloadURL());
        }).catch((error) => {
          console.log('썸네일 재업로드 실패: ', error);
        })
      });

      updateThumbnailUrl(docId, res);
      
    } catch (error) {
      console.log(error);
    }
  }

  async function updateThumbnailUrl(docId, thumbnailUrl) {
    dbService.doc(`items/${docId}`).update({
      thumbnailUrl: thumbnailUrl,
    });
    console.log('======== 업데이트 완료. 변경 파일 URL: ', thumbnailUrl);
  } 

  // 썸네일 이미지 만들기
  const handleImageConverter = () => {
    console.log('========= 썸네일 이미지 만들기 시작');
    const file = document.getElementById("origin-image").files[0];
    resizeImage(file);
  }

  function resizeImage(file) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (event) {
      const image = new Image();
      image.width = width;
      image.height = height;
      image.title = 'thumbnail';
      image.src = reader.result;

      image.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(image, 0, 0, width, height);
        const dataUri = canvas.toDataURL("image/webp", 0.7);
        const thumb = new Image();
        thumb.src=dataUri;
        document.getElementById('thumbnail').appendChild(thumb);
      }
    }
  }

  const changeStartDate = (event) => {
    setStartDate(event.target.value);
  }

  const changeEndDate = (event) => {
    setEndDate(event.target.value);
  }

  const changeWidht = (event) => {
    setWidth(event.target.value);
  }

  const changeHeight = (event) => {
    setHeight(event.target.value);
  }

  return (
    <section className="wrapContainer dark">
      <div className="container"  style={{color:"white"}}>
        <div style={{display:'flex', alignItems:'center', gap:20}}>
          <div style={{margin:10}}>
            시작일 <input type="date" onChange={changeStartDate} style={{padding:10, margin:10}} />
          </div>
          <p>~</p>
          <div>
            종료일 <input type="date" onChange={changeEndDate} style={{padding:10, margin:10}} />
          </div>
        </div>
        <div style={{display:"flex", gap:30, justifyContent:'center', alignItems:'flex-start', textAlign:'center'}}>
          <div style={{display:"flex", flexDirection:"column", gap:50}}>
            <div>
              <h2 style={{marginBottom:0}}>기간별 이미지 압축하기</h2>
              <input type="button" className="factoryInput__arrow" onClick={handleImageCompression} value="Start" />
            </div>
            <div>
              <h2 style={{marginBottom:0}}>기간별 썸네일만 추가하기</h2>
              <input type="button" className="factoryInput__arrow" onClick={handleCreateThumbnail} value="Start" />
            </div>
            <div>
              <h2 style={{marginBottom:0}}>기간별 이미지 다운로드</h2>
              <input type="button" className="factoryInput__arrow" onClick={handleImageDownload} value="Download" />
            </div>
          </div>
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:10}}>
            <h2>썸네일 이미지 만들기</h2>
            <div>
              width <input type="number" onChange={changeWidht} style={{width:100, padding:10, borderRadius:5, marginRight:10}} />
              height <input type="number" onChange={changeHeight} style={{width:100, padding:10, borderRadius:5}} />
            </div>
            <input type="file" id="origin-image" style={{width:290, color:'#333', backgroundColor:'white', padding:10, borderRadius:5}} />
            <input type="button" className="factoryInput__arrow" onClick={handleImageConverter} value="Create" />
            <div id="thumbnail"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImageCompressior;