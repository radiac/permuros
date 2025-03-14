import {
  ClassicEditor,
  Alignment,
  Autoformat,
  Autosave,
  Bold,
  Essentials,
  FontBackgroundColor,
  FontColor,
  FontFamily,
  FontSize,
  Heading,
  HorizontalLine,
  Italic,
  Link,
  List,
  ListProperties,
  Paragraph,
  Strikethrough,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  TextTransformation,
  TodoList,
  Underline,
} from "ckeditor5";

import { Plugin, ButtonView } from "ckeditor5";
//import { toWidget, toWidgetEditable } from "@ckeditor/ckeditor5-widget/src/utils";

class SaveButtonPlugin extends Plugin {
  init() {
    const editor = this.editor;

    editor.ui.componentFactory.add("saveButton", (locale) => {
      const view = new ButtonView(locale);

      view.set({
        withText: false,
        tooltip: "Save",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7 19V13H17V19H19V7.82843L16.1716 5H5V19H7ZM4 3H17L21 7V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3ZM9 15V19H15V15H9Z"></path></svg>',
      });

      // Execute the save action when the button is clicked
      view.on("execute", () => {
        editor.permuros_saved = true;
        const content = editor.getData();
        document.getElementById("editorContent").value = content;
        htmx.trigger(document.getElementById("editorForm"), "submit");
      });

      return view;
    });
  }
}

class PrintButtonPlugin extends Plugin {
  init() {
    const editor = this.editor;

    editor.ui.componentFactory.add("printButton", (locale) => {
      const view = new ButtonView(locale);

      view.set({
        tooltip: "Print", // Define the tooltip text here
        withText: false, // Set to false to only show the icon
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17 2C17.5523 2 18 2.44772 18 3V7H21C21.5523 7 22 7.44772 22 8V18C22 18.5523 21.5523 19 21 19H18V21C18 21.5523 17.5523 22 17 22H7C6.44772 22 6 21.5523 6 21V19H3C2.44772 19 2 18.5523 2 18V8C2 7.44772 2.44772 7 3 7H6V3C6 2.44772 6.44772 2 7 2H17ZM16 17H8V20H16V17ZM20 9H4V17H6V16C6 15.4477 6.44772 15 7 15H17C17.5523 15 18 15.4477 18 16V17H20V9ZM8 10V12H5V10H8ZM16 4H8V7H16V4Z"></path></svg>',
      });

      // Execute the print action when the button is clicked
      view.on("execute", () => {
        const content = editor.getData();
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
          <html>
            <head>
              <title>Print from Write</title>
              <link id="stylesheet" rel="stylesheet" href="/static/write/print.css">
            </head>
            <body>
              ${content}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.addEventListener("load", () => {
          printWindow.print();
          printWindow.close();
        });
      });

      return view;
    });
  }
}

/**
 * Create a free account with a trial: https://portal.ckeditor.com/checkout?plan=free
 */
const LICENSE_KEY = "GPL"; // or <YOUR_LICENSE_KEY>.

const editorConfig = {
  toolbar: {
    items: [
      "saveButton",
      "printButton",
      "|",
      "heading",
      "|",
      "fontSize",
      "fontFamily",
      "fontColor",
      //"fontBackgroundColor",
      "|",
      "bold",
      "italic",
      "underline",
      "strikethrough",
      "|",
      "horizontalLine",
      //"link",
      "insertTable",
      "|",
      "alignment",
      "|",
      "bulletedList",
      "numberedList",
      "todoList",
    ],
    shouldNotGroupWhenFull: false,
  },
  plugins: [
    Alignment,
    Autoformat,
    Autosave,
    Bold,
    Essentials,
    //FontBackgroundColor,
    FontColor,
    FontFamily,
    FontSize,
    Heading,
    HorizontalLine,
    Italic,
    //Link,
    List,
    ListProperties,
    Paragraph,
    Strikethrough,
    Table,
    TableCaption,
    TableCellProperties,
    TableColumnResize,
    TableProperties,
    TableToolbar,
    TextTransformation,
    TodoList,
    Underline,

    SaveButtonPlugin,
    PrintButtonPlugin,
  ],
  fontFamily: {
    options: [
      "default",
      "Roboto, sans-serif",
      "Roboto Slab, serif",
      "Dancing Script, cursive",
      "Henny Penny, system-ui",
      "Monoton, sans-serif",
      "'Londrina Shadow', sans-serif",
    ],
    supportAllValues: true,
  },
  fontSize: {
    options: [10, 12, 16, 24, 32, 48, 72],
    supportAllValues: true,
  },
  heading: {
    options: [
      {
        model: "paragraph",
        title: "Paragraph",
        class: "ck-heading_paragraph",
      },
      {
        model: "heading1",
        view: "h1",
        title: "Heading 1",
        class: "ck-heading_heading1",
      },
      {
        model: "heading2",
        view: "h2",
        title: "Heading 2",
        class: "ck-heading_heading2",
      },
      {
        model: "heading3",
        view: "h3",
        title: "Heading 3",
        class: "ck-heading_heading3",
      },
      {
        model: "heading4",
        view: "h4",
        title: "Heading 4",
        class: "ck-heading_heading4",
      },
      {
        model: "heading5",
        view: "h5",
        title: "Heading 5",
        class: "ck-heading_heading5",
      },
      {
        model: "heading6",
        view: "h6",
        title: "Heading 6",
        class: "ck-heading_heading6",
      },
    ],
  },
  initialData: "",
  licenseKey: LICENSE_KEY,
  link: {
    addTargetToExternalLinks: true,
    defaultProtocol: "https://",
    decorators: {
      toggleDownloadable: {
        mode: "manual",
        label: "Downloadable",
        attributes: {
          download: "file",
        },
      },
    },
  },
  list: {
    properties: {
      styles: true,
      startIndex: true,
      reversed: true,
    },
  },
  placeholder: "Start writing, or load a file from the sidebar",
  table: {
    contentToolbar: [
      "tableColumn",
      "tableRow",
      "mergeTableCells",
      "tableProperties",
      "tableCellProperties",
    ],
  },
};

ClassicEditor.create(document.querySelector("#editor"), editorConfig)
  .then((editor) => {
    window.editor = editor;
    editor.permuros_loading = false;
    editor.permuros_saved = true;

    editor.model.document.on("change:data", () => {
      if (editor.permuros_loading) {
        editor.permuros_loading = false;
        return;
      }
      editor.permuros_saved = false;
    });

    function close(event) {
      if (editor.permuros_saved) {
        return;
      }
      const confirmed = confirm(
        "You have unsaved changes - are you sure you want to do this?"
      );
      if (!confirmed) {
        event.preventDefault();
      }
      return confirmed;
    }

    document.body.addEventListener("htmx:beforeRequest", close);
    window.addEventListener("beforeunload", close);
  })
  .catch((error) => {
    console.error(error);
  });
