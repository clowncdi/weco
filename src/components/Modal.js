const Modal = (props) => {
  const { open, close, header } = props;
  const onClickClose = (event) => {
    if (event.target.nodeName === "DIV") {
      close();
    }
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
