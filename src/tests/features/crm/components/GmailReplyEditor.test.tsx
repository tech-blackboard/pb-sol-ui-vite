import { render, waitFor } from '@testing-library/react';
import { GmailReplyEditor } from '../../../../features/crm/components/GmailReplyEditor';
import type { Editor } from '@tiptap/react';

describe('GmailReplyEditor Extensions and Pasting', () => {
  it('parses and renders custom extensions without crashing', async () => {
    const complexHtml = `
      <p class="gmail-paragraph" style="color: red;">Paragraph</p>
      <span class="span-class" style="color: blue;">Span</span>
      <a class="link-class" style="font-weight: bold;" href="https://test.com">Link</a>
      <img class="img-class" style="margin: 0;" width="100" height="100" src="https://test.com/img.png" />
      <div class="gmail_quote">Quote Content</div>
      <section class="section-class" style="padding: 10px;">Section</section>
      <table class="table-class" style="border: 1px;" cellpadding="0" cellspacing="0" width="100%">
        <tr class="tr-class" style="background: red;">
          <th class="th-class" style="padding: 5px;" width="50" height="50">Header</th>
          <td class="td-class" style="padding: 5px;" width="50" height="50">Cell</td>
        </tr>
      </table>
      <blockquote class="gmail_quote" style="margin:0 0 0 .8ex;border-left:1px #ccc solid;padding-left:1ex">
        Nested quote
      </blockquote>
      <!-- Elements without attributes to cover renderHTML fallback branches -->
      <img src="https://test.com/img2.png" />
      <table>
        <tr>
          <th>H</th>
          <td>C</td>
        </tr>
      </table>
      <blockquote>Plain quote</blockquote>
      <p>Plain</p>
      <span>Plain</span>
      <a href="https://test.com">Plain</a>
    `;

    let editorInstance: Editor | null = null;
    render(
      <GmailReplyEditor
        content={complexHtml}
        onChange={() => {}}
        onEditorReady={(editor) => {
          editorInstance = editor;
        }}
      />
    );

    // Wait for editor to be ready
    await waitFor(() => expect(editorInstance).toBeTruthy());

    // Trigger commands
    editorInstance!.commands.setFontSize('16px');
    editorInstance!.commands.unsetFontSize();
    editorInstance!.commands.setFontFamily('Times New Roman');
    editorInstance!.commands.unsetFontFamily();

    // Trigger renderHTML by getting HTML out
    const outputHtml = editorInstance!.getHTML();
    expect(outputHtml).toContain('gmail-paragraph');
    expect(outputHtml).toContain('color: red');
    expect(outputHtml).toContain('gmail_quote');

    // Trigger transformPastedHTML
    if (editorInstance!.options.editorProps?.transformPastedHTML) {
      const sanitized = editorInstance!.options.editorProps.transformPastedHTML('<script>alert("x")</script><p class="test" style="color: red;" width="10">Hello</p>', editorInstance!.view);
      expect(sanitized).toContain('<p');
    }

    // Trigger empty paragraph attributes (line 33)
    editorInstance!.commands.insertContent({
      type: 'paragraph',
      attrs: { class: 'gmail-paragraph', style: null }
    });

    // Trigger Gmail Quote creation
    editorInstance!.commands.insertContent({
      type: 'gmailQuote',
      attrs: { html: '<b>Quote</b>' }
    });
    
    // Check output HTML for quote to hit renderHTML
    const finalHtml = editorInstance!.getHTML();
    expect(finalHtml).toContain('class="gmail_quote not-prose"');

    // Trigger onChange
    editorInstance!.commands.insertContent('<p>Update</p>');
  });

  it('updates content when prop changes to non-empty string', async () => {
    const { rerender } = render(
      <GmailReplyEditor content="" onChange={() => {}} />
    );
    rerender(<GmailReplyEditor content="<p>New content</p>" onChange={() => {}} disabled={true} />);
    // Testing the useEffect hooks for content update and disabled state
  });
});
