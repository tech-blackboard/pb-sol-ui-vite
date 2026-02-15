import { render, screen, fireEvent, act } from '@testing-library/react';
import ServerIssueAlert from '../../alerts/ServerIssueAlert';

describe('ServerIssueAlert', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('renders nothing when isOpen is false', () => {
        const { container } = render(<ServerIssueAlert isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    test('renders alert when isOpen is true', () => {
        render(<ServerIssueAlert isOpen={true} />);
        expect(screen.getByText('Server Unavailable')).toBeInTheDocument();
    });

    test('calls onClose when Dismiss button is clicked', () => {
        const onClose = jest.fn();
        render(<ServerIssueAlert isOpen={true} onClose={onClose} />);

        fireEvent.click(screen.getByText('Dismiss'));
        expect(onClose).toHaveBeenCalled();
    });

    test('shows retrying state when Retry Connection is clicked', async () => {
        render(<ServerIssueAlert isOpen={true} />);

        const retryBtn = screen.getByText('Retry Connection');
        fireEvent.click(retryBtn);

        expect(screen.getByText('Checking Server...')).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(2000);
        });

        expect(screen.getByText('Retry Connection')).toBeInTheDocument();
    });
});
