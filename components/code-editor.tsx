"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  dropCursor,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  redo,
  selectAll,
  undo,
} from "@codemirror/commands";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { showMinimap } from "@replit/codemirror-minimap";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { go } from "@codemirror/lang-go";
import { php } from "@codemirror/lang-php";
import { sql } from "@codemirror/lang-sql";
import { yaml } from "@codemirror/lang-yaml";
import { vue } from "@codemirror/lang-vue";
import { markdown } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";
import { xml } from "@codemirror/lang-xml";
import { rust } from "@codemirror/lang-rust";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export interface CodeEditorHandle {
  getValue: () => string;
  getSelectionText: () => string;
  replaceSelection: (text: string) => void;
  focus: () => void;
}

interface CodeEditorProps {
  fileName: string;
  value: string;
  isDirty: boolean;
  onChange: (value: string) => void;
  onSelectionChange?: (selectionText: string) => void;
}

const themeExtension = EditorView.theme({
  "&": {
    color: "#D4D4D4",
    backgroundColor: "#1E1E1E",
    fontFamily:
      "\"JetBrains Mono\", var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace",
    fontSize: "14px",
    lineHeight: "22px",
    height: "100%",
  },
  ".cm-editor": {
    height: "100%",
    maxHeight: "100%",
    backgroundColor: "#1E1E1E",
  },
  ".cm-scroller": {
    height: "100%",
    overflow: "auto",
  },
  ".cm-content": {
    minHeight: "100%",
    padding: "12px 0",
  },
  ".cm-gutters": {
    backgroundColor: "#1E1E1E",
    color: "#858585",
    borderRight: "1px solid #2A2A2A",
  },
  ".cm-line": {
    paddingLeft: "8px",
    paddingRight: "8px",
  },
  ".cm-activeLine": {
    backgroundColor: "#2A2A2A",
  },
  ".cm-selectionBackground": {
    backgroundColor: "rgba(38, 79, 120, 0.7)",
  },
  ".cm-selectionMatch": {
    backgroundColor: "#3A3D41",
  },
  ".cm-content ::selection": {
    backgroundColor: "rgba(38, 79, 120, 0.7)",
  },
  ".cm-cursor": {
    borderLeftColor: "#AEAFAD",
  },
  ".cm-activeLineGutter": {
    color: "#C6C6C6",
  },
  ".cm-minimap-gutter": {
    width: "72px",
  },
  ".cm-minimap-inner": {
    width: "72px",
  },
  ".cm-minimap-inner canvas": {
    width: "72px",
    maxWidth: "72px",
  },
  ".cm-minimap-box-shadow": {
    boxShadow: "8px 0px 16px 2px #00000066",
  },
  ".cm-minimap-overlay-container .cm-minimap-overlay": {
    backgroundColor: "#264F78",
    opacity: "0.45",
  },
});

const highlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#C586C0" },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: "#9CDCFE" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "#DCDCAA" },
  { tag: [t.string, t.special(t.string)], color: "#CE9178" },
  { tag: [t.number, t.bool, t.null], color: "#B5CEA8" },
  { tag: t.comment, color: "#6A9955", fontStyle: "italic" },
  { tag: [t.operator, t.punctuation], color: "#D4D4D4" },
  { tag: t.typeName, color: "#4EC9B0" },
]);

const minimap = () => [
  showMinimap.compute(["doc", "selection"], (state) => {
    const dom = document.createElement("div");
    const gutters: Record<number, string> = {};

    for (const range of state.selection.ranges) {
      const startLine = state.doc.lineAt(range.from).number;
      const endLine = state.doc.lineAt(range.to).number;
      for (let line = startLine; line <= endLine; line += 1) {
        gutters[line] = "rgba(38, 79, 120, 0.75)";
      }
    }

    return {
      create: () => ({ dom }),
      gutters: [gutters],
      showOverlay: "always",
    };
  }),
];

function getLanguageExtension(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
      return javascript({ typescript: ext === "ts" || ext === "tsx" });
    case "json":
      return json();
    case "html":
      return html();
    case "css":
    case "scss":
    case "sass":
      return css();
    case "vue":
      return vue();
    case "md":
    case "mdx":
      return markdown();
    case "py":
      return python();
    case "php":
      return php();
    case "sql":
      return sql();
    case "yaml":
    case "yml":
      return yaml();
    case "go":
      return go();
    case "xml":
      return xml();
    case "rs":
      return rust();
    case "java":
      return java();
    case "c":
    case "cpp":
    case "h":
      return cpp();
    default:
      return [];
  }
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  ({ fileName, value, isDirty, onChange, onSelectionChange }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const onChangeRef = useRef(onChange);
    const onSelectionChangeRef = useRef(onSelectionChange);

    const languageExtension = useMemo(() => getLanguageExtension(fileName), [fileName]);

    useEffect(() => {
      onChangeRef.current = onChange;
      onSelectionChangeRef.current = onSelectionChange;
    }, [onChange, onSelectionChange]);

    useEffect(() => {
      if (!editorRef.current) return;

      const view = new EditorView({
        state: EditorState.create({
          doc: value,
          extensions: [
            lineNumbers(),
            highlightActiveLineGutter(),
            highlightActiveLine(),
            drawSelection(),
            dropCursor(),
            history(),
            syntaxHighlighting(highlightStyle, { fallback: true }),
            highlightSelectionMatches(),
            EditorView.lineWrapping,
            themeExtension,
            languageExtension,
            minimap(),
            keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap, ...searchKeymap]),
            EditorView.updateListener.of((update) => {
              const selectionHandler = onSelectionChangeRef.current;
              if (update.selectionSet && selectionHandler) {
                const selection = update.state.selection.main;
                const selected = update.state.doc.sliceString(
                  selection.from,
                  selection.to,
                );
                selectionHandler(selected);
              }
              if (update.docChanged) {
                onChangeRef.current(update.state.doc.toString());
              }
            }),
          ],
        }),
        parent: editorRef.current,
      });

      viewRef.current = view;

      return () => {
        view.destroy();
        viewRef.current = null;
      };
    }, [languageExtension]);

    useEffect(() => {
      const view = viewRef.current;
      if (!view || isDirty) return;
      const current = view.state.doc.toString();
      if (current === value) return;
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }, [isDirty, value]);

    useImperativeHandle(
      ref,
      () => ({
        getValue: () => viewRef.current?.state.doc.toString() ?? "",
        getSelectionText: () => {
          const view = viewRef.current;
          if (!view) return "";
          const selection = view.state.selection.main;
          return view.state.doc.sliceString(selection.from, selection.to);
        },
        replaceSelection: (text: string) => {
          const view = viewRef.current;
          if (!view) return;
          const selection = view.state.selection.main;
          view.dispatch({
            changes: { from: selection.from, to: selection.to, insert: text },
            selection: { anchor: selection.from + text.length },
          });
        },
        focus: () => {
          viewRef.current?.focus();
        },
      }),
      [],
    );

    const runCommand = (command: (view: EditorView) => boolean) => {
      const view = viewRef.current;
      if (!view) return;
      command(view);
    };

    const getSelection = () => {
      const view = viewRef.current;
      if (!view) return "";
      const selection = view.state.selection.main;
      return view.state.doc.sliceString(selection.from, selection.to);
    };

    const copySelection = async () => {
      const selected = getSelection();
      if (!selected) return;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(selected);
          return;
        } catch {
          document.execCommand("copy");
          return;
        }
      }
      document.execCommand("copy");
    };

    const cutSelection = async () => {
      const view = viewRef.current;
      if (!view) return;
      const selection = view.state.selection.main;
      if (selection.empty) return;
      const selected = getSelection();
      let wroteToClipboard = false;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(selected);
          wroteToClipboard = true;
        } catch {
          wroteToClipboard = document.execCommand("cut");
        }
      } else {
        wroteToClipboard = document.execCommand("cut");
      }

      if (wroteToClipboard) {
        view.dispatch({ changes: { from: selection.from, to: selection.to, insert: "" } });
      }
    };

    const pasteClipboard = async () => {
      const view = viewRef.current;
      if (!view) return;
      let text = "";
      if (navigator.clipboard?.readText) {
        try {
          text = await navigator.clipboard.readText();
        } catch {
          document.execCommand("paste");
          return;
        }
      }
      if (!text) {
        document.execCommand("paste");
        return;
      }
      const selection = view.state.selection.main;
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: text },
        selection: { anchor: selection.from + text.length },
      });
    };

    return (
      <ContextMenu>
        <ContextMenuTrigger
          asChild
          onContextMenu={() => {
            viewRef.current?.focus();
          }}
        >
          <div ref={editorRef} className="size-full min-h-0 overflow-hidden" />
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => runCommand(undo)}>
            Undo
            <ContextMenuShortcut>Ctrl+Z</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => runCommand(redo)}>
            Redo
            <ContextMenuShortcut>Ctrl+Y</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={cutSelection}>
            Cut
            <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onSelect={copySelection}>
            Copy
            <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onSelect={pasteClipboard}>
            Paste
            <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={() => runCommand(selectAll)}>
            Select All
            <ContextMenuShortcut>Ctrl+A</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  },
);

CodeEditor.displayName = "CodeEditor";
