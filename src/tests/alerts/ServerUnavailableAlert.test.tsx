import { render, screen, fireEvent, act } from '@testing-library/react';
import ServerUnavailableAlert from '../../alerts/ServerUnavailableAlert';
import { reloadPage } from '../../utils/navigation';

jest.mock('../../utils/navigation', () => ({
    reloadPage: jest.fn(),
}));

describe('ServerUnavailableAlert', () => {
    const mockReload = reloadPage as jest.Mock;

    beforeEach(() => {
        jest.useFakeTimers();
        mockReload.mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('renders nothing when isOpen is false', () => {
        const { container } = render(<ServerUnavailableAlert isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    test('renders alert when isOpen is true', () => {
        render(<ServerUnavailableAlert isOpen={true} />);
        expect(screen.getByText('Server Unavailable')).toBeInTheDocument();
    });

    test('calls onClose when Dismiss button is clicked', () => {
        const onClose = jest.fn();
        render(<ServerUnavailableAlert isOpen={true} onClose={onClose} />);

        fireEvent.click(screen.getByText('Dismiss'));
        expect(onClose).toHaveBeenCalled();
    });

    test('reloads page when Retry Connection is clicked', async () => {
        render(<ServerUnavailableAlert isOpen={true} />);

        const retryBtn = screen.getByText('Retry Connection');
        fireEvent.click(retryBtn);

        expect(screen.getByText('Retrying...')).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(mockReload).toHaveBeenCalled();
    });

    test('increments retry count on multiple retries', async () => {
        render(<ServerUnavailableAlert isOpen={true} />);
        const retryBtn = screen.getByText('Retry Connection');

        // First retry
        fireEvent.click(retryBtn);
        expect(screen.getByText('Retrying...')).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(1001);
        });

        expect(mockReload).toHaveBeenCalledTimes(1);
    });
});
