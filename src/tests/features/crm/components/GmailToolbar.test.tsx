import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GmailToolbar } from '../../../../features/crm/components/GmailToolbar';
import { Editor } from '@tiptap/react';

describe('GmailToolbar', () => {
    let mockEditor: {
        chain: jest.Mock;
        focus: jest.Mock;
        undo: jest.Mock;
        redo: jest.Mock;
        toggleBold: jest.Mock;
        toggleItalic: jest.Mock;
        toggleUnderline: jest.Mock;
        setColor: jest.Mock;
        setHighlight: jest.Mock;
        setTextAlign: jest.Mock;
        toggleBulletList: jest.Mock;
        toggleOrderedList: jest.Mock;
        sinkListItem: jest.Mock;
        liftListItem: jest.Mock;
        toggleBlockquote: jest.Mock;
        clearNodes: jest.Mock;
        unsetAllMarks: jest.Mock;
        unsetFontFamily: jest.Mock;
        setFontFamily: jest.Mock;
        unsetFontSize: jest.Mock;
        setFontSize: jest.Mock;
        run: jest.Mock;
        isActive: jest.Mock;
        can: jest.Mock;
    };

    beforeEach(() => {
        mockEditor = {
            chain: jest.fn().mockReturnThis(),
            focus: jest.fn().mockReturnThis(),
            undo: jest.fn().mockReturnThis(),
            redo: jest.fn().mockReturnThis(),
            toggleBold: jest.fn().mockReturnThis(),
            toggleItalic: jest.fn().mockReturnThis(),
            toggleUnderline: jest.fn().mockReturnThis(),
            setColor: jest.fn().mockReturnThis(),
            setHighlight: jest.fn().mockReturnThis(),
            setTextAlign: jest.fn().mockReturnThis(),
            toggleBulletList: jest.fn().mockReturnThis(),
            toggleOrderedList: jest.fn().mockReturnThis(),
            sinkListItem: jest.fn().mockReturnThis(),
            liftListItem: jest.fn().mockReturnThis(),
            toggleBlockquote: jest.fn().mockReturnThis(),
            clearNodes: jest.fn().mockReturnThis(),
            unsetAllMarks: jest.fn().mockReturnThis(),
            unsetFontFamily: jest.fn().mockReturnThis(),
            setFontFamily: jest.fn().mockReturnThis(),
            unsetFontSize: jest.fn().mockReturnThis(),
            setFontSize: jest.fn().mockReturnThis(),
            run: jest.fn(),
            isActive: jest.fn().mockReturnValue(false),
            can: jest.fn().mockReturnValue({
                sinkListItem: jest.fn().mockReturnValue(true),
                liftListItem: jest.fn().mockReturnValue(true),
            })
        };
    });

    it('returns null if editor is null', () => {
        const { container } = render(<GmailToolbar editor={null} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders toolbar buttons when editor is provided', () => {
        render(<GmailToolbar editor={mockEditor as unknown as Editor} />);
        expect(screen.getByTitle('Undo')).toBeInTheDocument();
        expect(screen.getByTitle('Redo')).toBeInTheDocument();
        expect(screen.getByTitle('Bold')).toBeInTheDocument();
        expect(screen.getByTitle('Italic')).toBeInTheDocument();
        expect(screen.getByTitle('Underline')).toBeInTheDocument();
        expect(screen.getByTitle('Font Family')).toBeInTheDocument();
        expect(screen.getByTitle('Font Size')).toBeInTheDocument();
        expect(screen.getByTitle('Text color')).toBeInTheDocument();
        expect(screen.getByTitle('Alignment')).toBeInTheDocument();
        expect(screen.getByTitle('More formatting')).toBeInTheDocument();
        expect(screen.getByTitle('Remove formatting')).toBeInTheDocument();
    });

    it('handles basic formatting clicks', () => {
        render(<GmailToolbar editor={mockEditor as unknown as Editor} />);

        fireEvent.click(screen.getByTitle('Undo'));
        expect(mockEditor.undo).toHaveBeenCalled();

        fireEvent.click(screen.getByTitle('Redo'));
        expect(mockEditor.redo).toHaveBeenCalled();

        fireEvent.click(screen.getByTitle('Bold'));
        expect(mockEditor.toggleBold).toHaveBeenCalled();

        fireEvent.click(screen.getByTitle('Italic'));
        expect(mockEditor.toggleItalic).toHaveBeenCalled();

        fireEvent.click(screen.getByTitle('Underline'));
        expect(mockEditor.toggleUnderline).toHaveBeenCalled();

        fireEvent.click(screen.getByTitle('Remove formatting'));
        expect(mockEditor.clearNodes).toHaveBeenCalled();
        expect(mockEditor.unsetAllMarks).toHaveBeenCalled();
    });

    it('handles font family and size selects', () => {
        render(<GmailToolbar editor={mockEditor as unknown as Editor} />);

        const fontFamilySelect = screen.getByTitle('Font Family');
        fireEvent.change(fontFamilySelect, { target: { value: 'Arial' } });
        expect(mockEditor.setFontFamily).toHaveBeenCalledWith('Arial');

        fireEvent.change(fontFamilySelect, { target: { value: 'default' } });
        expect(mockEditor.unsetFontFamily).toHaveBeenCalled();

        const fontSizeSelect = screen.getByTitle('Font Size');
        fireEvent.change(fontSizeSelect, { target: { value: '18px' } });
        expect(mockEditor.setFontSize).toHaveBeenCalledWith('18px');

        fireEvent.change(fontSizeSelect, { target: { value: 'default' } });
        expect(mockEditor.unsetFontSize).toHaveBeenCalled();
    });

    it('toggles dropdown menus and handles clicks outside', () => {
        render(
            <div>
                <div data-testid="outside">Outside</div>
                <GmailToolbar editor={mockEditor as unknown as Editor} />
            </div>
        );

        const colorBtn = screen.getByTitle('Text color');
        fireEvent.click(colorBtn);
        expect(screen.getByText('Text Color')).toBeInTheDocument();

        // Click outside to close
        fireEvent.mouseDown(screen.getByTestId('outside'));
        expect(screen.queryByText('Text Color')).not.toBeInTheDocument();

        // Open Alignment
        const alignBtn = screen.getByTitle('Alignment');
        fireEvent.click(alignBtn);
        expect(screen.getByTitle('Align Left')).toBeInTheDocument();

        // Click a menu item (closes menu)
        fireEvent.click(screen.getByTitle('Align Center'));
        expect(mockEditor.setTextAlign).toHaveBeenCalledWith('center');
        expect(screen.queryByTitle('Align Left')).not.toBeInTheDocument();

        // Open Lists
        const listBtn = screen.getByTitle('More formatting');
        fireEvent.click(listBtn);
        expect(screen.getByTitle('Bullet List')).toBeInTheDocument();

        // Click a menu item
        fireEvent.click(screen.getByTitle('Numbered List'));
        expect(mockEditor.toggleOrderedList).toHaveBeenCalled();
    });

    it('handles color picker interactions', () => {
        render(<GmailToolbar editor={mockEditor as unknown as Editor} />);

        fireEvent.click(screen.getByTitle('Text color'));
        
        // Find all color buttons, click the first one (black)
        const buttons = screen.getAllByRole('button');
        const colorButtons = buttons.filter(b => b.className.includes('w-5 h-5')); // hacky but works for color swatches
        
        fireEvent.click(colorButtons[0]);
        expect(mockEditor.setColor).toHaveBeenCalledWith('#000000');
        expect(screen.queryByText('Text Color')).not.toBeInTheDocument();

        // Re-open and test highlight
        fireEvent.click(screen.getByTitle('Text color'));
        
        // Click the first highlight color (offset by TEXT_COLORS.length)
        const allColorButtons = screen.getAllByRole('button').filter(b => b.className.includes('w-5 h-5'));
        fireEvent.click(allColorButtons[46]); // First bg color
        expect(mockEditor.setHighlight).toHaveBeenCalledWith({ color: '#ffffff' });
    });

    it('handles all alignment options and active states', () => {
        const customMockEditor = { ...mockEditor, isActive: jest.fn((state) => {
            if (typeof state === 'object' && state.textAlign === 'right') return true;
            if (typeof state === 'object' && state.textAlign === 'center') return false;
            if (typeof state === 'object' && state.textAlign === 'justify') return false;
            if (state === 'orderedList') return true;
            if (state === 'bold') return true;
            return false;
        }) };
        render(<GmailToolbar editor={customMockEditor as unknown as Editor} />);

        const alignBtn = screen.getByTitle('Alignment');
        fireEvent.click(alignBtn);
        
        fireEvent.click(screen.getByTitle('Align Left'));
        expect(customMockEditor.setTextAlign).toHaveBeenCalledWith('left');
        
        fireEvent.click(alignBtn);
        fireEvent.click(screen.getByTitle('Align Center'));
        expect(customMockEditor.setTextAlign).toHaveBeenCalledWith('center');

        fireEvent.click(alignBtn);
        fireEvent.click(screen.getByTitle('Align Right'));
        expect(customMockEditor.setTextAlign).toHaveBeenCalledWith('right');

        fireEvent.click(alignBtn);
        fireEvent.click(screen.getByTitle('Justify'));
        expect(customMockEditor.setTextAlign).toHaveBeenCalledWith('justify');
    });

    it('handles list and indentation formatting comprehensively', () => {
        const customMockEditor = { ...mockEditor, isActive: jest.fn((state) => {
            if (state === 'orderedList') return true;
            if (state === 'bulletList') return true;
            if (state === 'blockquote') return true;
            return false;
        }) };
        render(<GmailToolbar editor={customMockEditor as unknown as Editor} />);

        fireEvent.click(screen.getByTitle('More formatting'));
        
        fireEvent.click(screen.getByTitle('Bullet List'));
        expect(customMockEditor.toggleBulletList).toHaveBeenCalled();

        fireEvent.click(screen.getByTitle('More formatting'));
        fireEvent.click(screen.getByTitle('Numbered List'));
        expect(customMockEditor.toggleOrderedList).toHaveBeenCalled();

        fireEvent.click(screen.getByTitle('More formatting'));
        fireEvent.click(screen.getByTitle('Indent'));
        expect(customMockEditor.sinkListItem).toHaveBeenCalledWith('listItem');

        fireEvent.click(screen.getByTitle('More formatting'));
        fireEvent.click(screen.getByTitle('Outdent'));
        expect(customMockEditor.liftListItem).toHaveBeenCalledWith('listItem');

        fireEvent.click(screen.getByTitle('More formatting'));
        fireEvent.click(screen.getByTitle('Quote'));
        expect(customMockEditor.toggleBlockquote).toHaveBeenCalled();
    });

    it('applies active classes and renders correct alignment icons', () => {
        // Test italic and underline active
        mockEditor.isActive.mockImplementation((param: unknown) => {
            if (param === 'italic') return true;
            if (param === 'underline') return true;
            const p = param as { textAlign?: string };
            if (p?.textAlign === 'left') return true;
            if (p?.textAlign === 'center') return true;
            if (p?.textAlign === 'right') return true;
            if (p?.textAlign === 'justify') return true;
            return false;
        });

        const { rerender } = render(<GmailToolbar editor={mockEditor as unknown as Editor} />);

        expect(screen.getByTitle('Italic')).toHaveClass('text-blue-600');
        expect(screen.getByTitle('Underline')).toHaveClass('text-blue-600');

        fireEvent.click(screen.getByTitle('Alignment'));
        expect(screen.getByTitle('Align Left')).toHaveClass('text-blue-600');
        expect(screen.getByTitle('Align Center')).toHaveClass('text-blue-600');
        expect(screen.getByTitle('Align Right')).toHaveClass('text-blue-600');
        expect(screen.getByTitle('Justify')).toHaveClass('text-blue-600');

        // Test the main alignment icon ternary branches
        mockEditor.isActive.mockImplementation((param: unknown) => typeof param === 'object' && (param as { textAlign?: string })?.textAlign === 'right');
        rerender(<GmailToolbar editor={mockEditor as unknown as Editor} />);

        mockEditor.isActive.mockImplementation((param: unknown) => typeof param === 'object' && (param as { textAlign?: string })?.textAlign === 'justify');
        rerender(<GmailToolbar editor={mockEditor as unknown as Editor} />);
    });
});
