import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/i18n/ko-kr";
import "@toast-ui/editor/dist/toastui-editor.css";
import colorSyntax from "@toast-ui/editor-plugin-color-syntax";
import "tui-color-picker/dist/tui-color-picker.css";
import "@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css";
import { useEffect } from "react";

export function EditorBox({ editorRef, onChange, text }) {
  useEffect(() => {
    editorRef.current?.getInstance().setHTML(text);
  }, []);

  return (
    <div className="edit_wrap">
      <Editor
        ref={editorRef}
        placeholder="간략하게 요약해 주세요"
        previewStyle="vertical"
        height="600px"
        initialEditType="wysiwyg"
        useCommandShortcut={false}
        hideModeSwitch={true}
        plugins={[colorSyntax]}
        language="ko-KR"
        onChange={onChange}
        toolbarItems={[
          ["heading", "bold", "italic"],
          ["hr", "quote"],
          // ["ul", "ol", "task", "indent", "outdent"],
          ["table", "image", "link"],
          // ["code", "codeblock"],
        ]}
        // 유튜브 삽입 및 미리보기 를 위한 설정(iframe)
        customHTMLRenderer={{
          htmlBlock: {
            iframe(node) {
              return [
                {
                  type: "openTag",
                  tagName: "iframe",
                  outerNewLine: true,
                  attributes: node.attrs,
                },
                { type: "html", content: node.childrenHTML },
                { type: "closeTag", tagName: "iframe", outerNewLine: true },
              ];
            },
          },
        }}
      />
    </div>
  );
}
