import React, { useEffect } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import { Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import DOMPurify from 'dompurify';
import HardBreak from '@tiptap/extension-hard-break';
import Paragraph from '@tiptap/extension-paragraph';

// ── Custom Extension: CustomParagraph ──
const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      class: {
        default: 'gmail-paragraph',
        parseHTML: (element: HTMLElement) => element.getAttribute('class') || 'gmail-paragraph',
        renderHTML: (attributes: Record<string, any>) => {
          return { class: attributes.class };
        },
      },
      style: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('style') || null,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
    };
  },
});

// ── Custom Extension: Span Block ──
const SpanExtension = Node.create({
  name: 'spanBlock',
  group: 'inline',
  inline: true,
  content: 'inline*',
  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('style') || null,
        renderHTML: (attrs: Record<string, any>) => attrs.style ? { style: attrs.style } : {},
      },
      class: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('class') || null,
        renderHTML: (attrs: Record<string, any>) => attrs.class ? { class: attrs.class } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
});

// ── Custom Extension: CustomLink ──
const CustomLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('class') || null,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.class) return {};
          return { class: attributes.class };
        },
      },
      style: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('style') || null,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
    };
  },
});

// ── Custom Extension: CustomImage ──
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('class') || null,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.class) return {};
          return { class: attributes.class };
        },
      },
      style: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('style') || null,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('width') || null,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('height') || null,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
    };
  },
});

// ── Custom Extension: Gmail Quote ──
const GmailQuote = Node.create({
  name: 'gmailQuote',
  group: 'block',
  content: '',
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      html: {
        default: '',
        parseHTML: (element: HTMLElement) => element.innerHTML,
        renderHTML: () => {
          return { class: 'gmail_quote not-prose', contenteditable: 'false' };
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'div.gmail_quote',
      },
      {
        tag: 'blockquote.gmail_quote',
      },
    ];
  },
  renderHTML({ node }) {
    const dom = document.createElement('div');
    dom.className = 'gmail_quote not-prose';
    dom.setAttribute('contenteditable', 'false');
    dom.style.borderLeft = '2px solid #cbd5e1';
    dom.style.paddingLeft = '1rem';
    dom.style.marginLeft = '0.5rem';
    dom.style.marginTop = '1rem';
    dom.style.color = '#475569';
    dom.innerHTML = node.attrs.html;
    return dom;
  },
});

// ── Custom Extension: Div Block ──
const DivExtension = Node.create({
  name: 'divBlock',
  group: 'block',
  content: 'block*',
  defining: true,
  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('class') || null,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.class) return {};
          return { class: attributes.class };
        },
      },
      style: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('style') || null,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
    };
  },
  parseHTML() {
    return [
      { tag: 'div' },
      { tag: 'section' },
      { tag: 'article' },
      { tag: 'header' },
      { tag: 'footer' },
      { tag: 'aside' },
      { tag: 'center' },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', HTMLAttributes, 0];
  },
});

// ── Custom Extension: Tables ──
const TableExtension = Node.create({
  name: 'table',
  group: 'block',
  content: 'tableRow+',
  defining: true,
  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('style') || null,
        renderHTML: (attrs: Record<string, any>) => attrs.style ? { style: attrs.style } : {},
      },
      class: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('class') || null,
        renderHTML: (attrs: Record<string, any>) => attrs.class ? { class: attrs.class } : {},
      },
      cellpadding: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('cellpadding') || null,
        renderHTML: (attrs: Record<string, any>) => attrs.cellpadding ? { cellpadding: attrs.cellpadding } : {},
      },
      cellspacing: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('cellspacing') || null,
        renderHTML: (attrs: Record<string, any>) => attrs.cellspacing ? { cellspacing: attrs.cellspacing } : {},
      },
      width: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('width') || null,
        renderHTML: (attrs: Record<string, any>) => attrs.width ? { width: attrs.width } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: 'table' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['table', HTMLAttributes, 0];
  },
});

const TableRowExtension = Node.create({
  name: 'tableRow',
  content: '(tableCell | tableHeader)*',
  defining: true,
  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('style') || null,
        renderHTML: (attrs: Record<string, any>) => attrs.style ? { style: attrs.style } : {},
      },
      class: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('class') || null,
        renderHTML: (attrs: Record<string, any>) => attrs.class ? { class: attrs.class } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: 'tr' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['tr', HTMLAttributes, 0];
  },
});

const TableCellExtension = Node.create({
  name: 'tableCell',
  content: 'block*',
  defining: true,
  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('style') || null,
        renderHTML: (attrs: Record<string, any>) => attrs.style ? { style: attrs.style } : {},
      },
      class: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('class') || null,
        renderHTML: (attrs: Record<string, any>) => attrs.class ? { class: attrs.class } : {},
      },
      width: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('width') || null,
        renderHTML: (attrs: Record<string, any>) => attrs.width ? { width: attrs.width } : {},
      },
      height: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('height') || null,
        renderHTML: (attrs: Record<string, any>) => attrs.height ? { height: attrs.height } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: 'td' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['td', HTMLAttributes, 0];
  },
});

const TableHeaderExtension = Node.create({
  name: 'tableHeader',
  content: 'block*',
  defining: true,
  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('style') || null,
        renderHTML: (attrs: Record<string, any>) => attrs.style ? { style: attrs.style } : {},
      },
      class: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('class') || null,
        renderHTML: (attrs: Record<string, any>) => attrs.class ? { class: attrs.class } : {},
      },
      width: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('width') || null,
        renderHTML: (attrs: Record<string, any>) => attrs.width ? { width: attrs.width } : {},
      },
      height: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('height') || null,
        renderHTML: (attrs: Record<string, any>) => attrs.height ? { height: attrs.height } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: 'th' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['th', HTMLAttributes, 0];
  },
});

// ── Custom Extension: FontSize ──
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: Record<string, any>) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize: null }).run();
      },
    } as any;
  },
});

// ── Custom Extension: FontFamily ──
const FontFamily = Extension.create({
  name: 'fontFamily',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontFamily || null,
            renderHTML: (attributes: Record<string, any>) => {
              if (!attributes.fontFamily) {
                return {};
              }
              return {
                style: `font-family: ${attributes.fontFamily}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontFamily: (fontFamily: string) => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontFamily }).run();
      },
      unsetFontFamily: () => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontFamily: null }).run();
      },
    } as any;
  },
});

const normalizeContent = (html: string) => {
  return html.replace(
    /<p>(.*?)<br\s*\/?>(.*?)<\/p>/g,
    '<p>$1</p><p>$2</p>'
  );
};

interface GmailReplyEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onEditorReady?: (editor: any) => void;
}


export const GmailReplyEditor: React.FC<GmailReplyEditorProps> = ({
  content,

  onChange,
  placeholder = 'Type your reply...',
  disabled = false,
  onEditorReady
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        underline: false,
        link: false,
        paragraph: false, // Disable default paragraph to use CustomParagraph
        hardBreak: false, // Disable default hardBreak to use custom extended version below

        bulletList: {
          keepMarks: true,
          keepAttributes: true,
        },

        orderedList: {
          keepMarks: true,
          keepAttributes: true,
        },
      }),
      CustomParagraph,
      TableExtension,
      TableRowExtension,
      TableCellExtension,
      TableHeaderExtension,
      HardBreak.extend({
        addKeyboardShortcuts() {
          return {
            'Shift-Enter': () =>
              this.editor.commands.setHardBreak(),
          };
        },
      }),
      DivExtension,
      GmailQuote,
      TextStyle,
      Underline,
      Color,
      FontFamily,
      FontSize,

      Highlight.configure({
        multicolor: true,
      }),

      TextAlign.configure({
        types: ['heading', 'paragraph', 'divBlock'],
      }),

      SpanExtension,

      CustomLink.configure({
        openOnClick: false,
      }),

      CustomImage.configure({}),

      Placeholder.configure({
        placeholder,
      }),
    ],
    content: normalizeContent(content),
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {

      attributes: {
        class: 'w-full min-h-[300px] max-h-[500px] overflow-y-auto outline-none focus:ring-0 prose dark:prose-invert max-w-none text-sm leading-relaxed p-4',
        placeholder: placeholder,


      },
      transformPastedHTML(html) {
        return DOMPurify.sanitize(html, {
          ALLOWED_TAGS: [
            'p', 'br', 'strong', 'em', 'u', 'span',
            'a', 'img', 'ol', 'ul', 'li',
            'blockquote', 'h1', 'h2', 'h3', 'h4',
            'div', 'table', 'tbody', 'thead',
            'tr', 'td', 'th', 'hr'
          ],
          ALLOWED_ATTR: [
            'href',
            'src',
            'alt',
            'style',
            'class',
            'target',
            'width',
            'height',
            'align',
            'cellpadding',
            'cellspacing'
          ],
        });
      },


    },
  });

  // Notify parent component when editor is instantiated
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Keep editor content synchronized with props, without resetting selection
  useEffect(() => {
    if (editor && typeof content === 'string') {

      const currentHtml = editor.getHTML().trim();
      const incomingHtml = content.trim();

      // Force update if editor is empty or content differs
      if (
        (content === '' && !editor.isEmpty) ||
        currentHtml !== incomingHtml
      ) {
        editor.commands.setContent(incomingHtml, {
          emitUpdate: false,
        });
      }
    }
  }, [content, editor]);

  // Keep editable state synced
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  return (
    <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-b-lg min-h-[300px] max-h-[500px] overflow-y-auto">
      <EditorContent editor={editor} />
    </div>
  );
};
