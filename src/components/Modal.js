import Disqus from "disqus-react";

const Modal = (props) => {
  const { open, close, header, itemObj } = props;
  const onClickClose = (event) => {
    if (event.target.nodeName === "DIV") {
      close();
    }
  };

  const disqusShortname = "weco";
  const disqusConfig = {
    url: `${window.location.href}${itemObj.id}`,
    identifier: itemObj.id,
    title: itemObj.title,
  };

  return (
    <div className={open ? "openModal modal" : "modal"} onClick={onClickClose}>
      {open && (
        <section>
          <header>
            {header}
            <button className="close" onClick={close}>
              {" "}
              &times;{" "}
            </button>
          </header>
          <main className="main">{props.children}</main>
          <Disqus.DiscussionEmbed
            shortname={disqusShortname}
            config={disqusConfig}
          />
          <footer>
            <button className="close" onClick={close}>
              {" "}
              닫기{" "}
            </button>
          </footer>
        </section>
      )}
    </div>
  );
};

export default Modal;
