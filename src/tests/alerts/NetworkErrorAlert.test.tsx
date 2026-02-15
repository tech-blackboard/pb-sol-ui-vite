import { render, screen, fireEvent, act } from '@testing-library/react';
import NetworkErrorAlert from '../../alerts/NetworkErrorAlert';

describe('NetworkErrorAlert', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('renders nothing when isOpen is false', () => {
        const { container } = render(<NetworkErrorAlert isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    test('renders alert when isOpen is true', () => {
        render(<NetworkErrorAlert isOpen={true} />);
        expect(screen.getByText('No Internet Connection')).toBeInTheDocument();
    });

    test('calls onClose when Dismiss button is clicked', () => {
        const onClose = jest.fn();
        render(<NetworkErrorAlert isOpen={true} onClose={onClose} />);

        fireEvent.click(screen.getByText('Dismiss'));
        expect(onClose).toHaveBeenCalled();
    });

    test('shows retrying state when Check Connection is clicked', async () => {
        render(<NetworkErrorAlert isOpen={true} />);

        const checkBtn = screen.getByText('Check Connection');
        fireEvent.click(checkBtn);

        expect(screen.getByText('Checking Connection...')).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(2000);
        });

        expect(screen.getByText('Check Connection')).toBeInTheDocument();
    });

    test('updates online status when navigator.onLine changes', () => {
        render(<NetworkErrorAlert isOpen={true} />);

        // Default online status in JSDOM is true
        expect(screen.getByText('✓ Online')).toBeInTheDocument();

        // Since we can't easily mock navigator.onLine reactively without custom events
        // Let's trigger the windows events
        act(() => {
            window.dispatchEvent(new Event('offline'));
        });

        expect(screen.getByText('✗ Offline')).toBeInTheDocument();

        act(() => {
            window.dispatchEvent(new Event('online'));
        });

        expect(screen.getByText('✓ Online')).toBeInTheDocument();
    });
});
