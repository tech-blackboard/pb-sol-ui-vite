import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmailBody from '../../../../features/crm/components/EmailBody';

describe('EmailBody', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders fallback when no content is provided', () => {
    render(<EmailBody />);
    expect(screen.getByText('No content')).toBeInTheDocument();
    expect(screen.getByText('No content')).toHaveClass('italic');
  });

  it('renders plain text content when only text is provided', () => {
    const textContent = 'Hello, this is a plain text email.';
    render(<EmailBody text={textContent} />);
    expect(screen.getByText(textContent)).toBeInTheDocument();
    expect(screen.getByText(textContent)).toHaveClass('whitespace-pre-wrap');
  });

  it('renders HTML content in an iframe', () => {
    const htmlContent = '<h1>Hello</h1><p>World</p>';
    render(<EmailBody html={htmlContent} />);
    
    const iframe = screen.getByTitle('Email Message Content') as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    expect(iframe.srcdoc).toContain(htmlContent);
    expect(iframe.srcdoc).toContain('<!DOCTYPE html>');
  });

  it('updates iframe height on load and interval', () => {
    const htmlContent = '<div class="overflow-fix">Content</div>';
    render(<EmailBody html={htmlContent} />);
    
    const iframe = screen.getByTitle('Email Message Content') as HTMLIFrameElement;
    
    // Mock iframe structure
    const mockBody = { offsetHeight: 500 };
    Object.defineProperty(iframe, 'contentWindow', {
      value: {
        document: {
          body: {},
          querySelector: jest.fn().mockReturnValue(mockBody)
        }
      },
      writable: true
    });

    // Trigger load event
    fireEvent.load(iframe);
    
    // Check if height updated (via interval or load)
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Since we can't easily check internal state, we check the style
    expect(iframe.style.height).toBe('500px');

    // Test height change
    mockBody.offsetHeight = 800;
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(iframe.style.height).toBe('800px');
  });

  it('cleans up event listeners and intervals on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(HTMLIFrameElement.prototype, 'removeEventListener');
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
    
    const { unmount } = render(<EmailBody html="<p>test</p>" />);
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
    expect(clearIntervalSpy).toHaveBeenCalled();
    
    removeEventListenerSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });
});
