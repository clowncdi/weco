import { storageService, dbService } from "fbase";
import imageCompression from 'browser-image-compression';
import { useState } from "react";
import { uuidv4 } from "@firebase/util";

const ImageCompressior = () => {
  const [ext, setExt] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const doc = 'S9nPnnJhejVZ2HJsVVmYaTxTB732';
  const oldDoc = 'Vf46gZOvLVagkCQbvZxSqXyjrDu1';
  const ref = storageService.ref();

  const handleImageDownload = async () => {
    console.log('이미지 다운로드 시작')
    let result = await dbService
        .collection("items")
        .where("creatorId", "==", process.env.REACT_APP_ADMIN)
        .where("date", ">=", startDate)
        .where("date", "<=", endDate)
        .orderBy("date", "desc");
    result.onSnapshot((snapshot) => {
      console.log('이미지 갯수: ', snapshot.docs.length);
      snapshot.docs.map((doc) => {
        download(doc.data().attachmentUrl, doc.data().date);
      });
    })    
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
            items.push({num: count, id: doc.id, date: doc.data().date, url: doc.data().attachmentUrl});
          });
          resolve(items);
        })
        .catch((error) => {
          console.log("Error getting documents: ", error);
        });
      });
  }

  const handleImageCompression = async () => {
    console.log('========= 이미지 압축시작');

    let items = await getItems();
    console.log('전체 아이템: ',items)

    items.forEach(async (item) => {
      console.log('업데이트 호출 시작: ', item);
      updateImage(item.id, item.url);
    });
  }

  async function updateImage(docId, url) {
    let httpRef = await storageService.refFromURL(url);
    if (httpRef.name.indexOf('.') > 0) {
      setExt(httpRef.name.split('.').pop());
    }

    const init = await fetch(url, {method: "get"});
    const blob = await init.blob();
    compressedFile(blob, httpRef.name, docId);
  }

  async function compressedFile(blob, originFileName, docId) {
    console.log(`originalFile size ${blob.size / 1024 / 1024} MB`);

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1000,
      useWebWorker: true,
      initialQuality: 0.7
    }
    try {
      const compressedFile = await imageCompression(blob, options);
      console.log(`compressedFile size ${compressedFile.size / 1024 / 1024} MB`);
      console.log('원본 파일 이름: ', originFileName);

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

        ref.child(`${doc}/${uuidv4()}${ext ? '.'+ext : '.jpg'}`).put(compressedFile)
        .then((snapshot) => {
          return snapshot.ref.getDownloadURL();
        }).catch((error) => {
          console.log('재업로드 실패: ', error);
        })
      ]);

      updateAttachmentUrl(docId, res[1]);
      
    } catch (error) {
      console.log(error);
    }
  }

  async function updateAttachmentUrl(docId, url) {
    dbService.doc(`items/${docId}`).update({
      attachmentUrl: url,
    });
    console.log('======== 업데이트 완료. 변경 파일 URL: ', url);
  } 


  const handleImageConverter = () => {
    console.log('webp 변환은 준비중입니다.')
  }

  const changeStartDate = (event) => {
    setStartDate(event.target.value);
  }

  const changeEndDate = (event) => {
    setEndDate(event.target.value);
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
        <div style={{display:"flex", gap:30, justifyContent:'center', alignItems:'center', textAlign:'center'}}>
          <div>
            <h2>이미지 압축하기</h2>
            <input type="button" className="factoryInput__arrow" onClick={handleImageCompression} value="Start" />
          </div>
          <div>
            <h2>이미지 다운로드</h2>
            <input type="button" className="factoryInput__arrow" onClick={handleImageDownload} value="Download" />
          </div>
          <div>
            <h2>이미지 webp로 변환하기</h2>
            <input type="button" className="factoryInput__arrow" onClick={handleImageConverter} value="Start" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImageCompressior;