const News = ({ itemObj, isOwner }) => {
  const content = itemObj.text;

  return (
    <div className="itemContainer">
      <>
        {isOwner ? (
          <>
            {itemObj.attachmentUrl && (
              <img src={itemObj.attachmentUrl} width={500} />
            )}
            <p>{itemObj.date}</p>
            <p>{itemObj.title}</p>
            <div dangerouslySetInnerHTML={{ __html: content }}></div>
          </>
        ) : (
          <>
            {itemObj.attachmentUrl && (
              <img src={itemObj.attachmentUrl} width={500} />
            )}
            <p>{itemObj.date}</p>
            <p>{itemObj.title}</p>
            <div dangerouslySetInnerHTML={{ __html: content }}></div>
          </>
        )}
      </>
    </div>
  );
};

export default News;
