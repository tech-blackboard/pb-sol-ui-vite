import { render, screen, fireEvent } from '@testing-library/react';
import NoPermissionsAlert from '../../alerts/NoPermissionAlert';

describe('NoPermissionsAlert', () => {
    test('renders nothing when isOpen is false', () => {
        const { container } = render(<NoPermissionsAlert isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    test('renders alert with default message when isOpen is true', () => {
        render(<NoPermissionsAlert isOpen={true} />);
        expect(screen.getByText('No Permissions Assigned')).toBeInTheDocument();
        expect(screen.getByText(/Your account doesn't have permissions/)).toBeInTheDocument();
    });

    test('renders alert with custom message', () => {
        const customMessage = 'Custom Error Message';
        render(<NoPermissionsAlert isOpen={true} message={customMessage} />);
        expect(screen.getByText(customMessage)).toBeInTheDocument();
        expect(screen.getByText(/Please contact support or try again/)).toBeInTheDocument();
    });

    test('calls onClose when Close button is clicked', () => {
        const onClose = jest.fn();
        render(<NoPermissionsAlert isOpen={true} onClose={onClose} />);

        fireEvent.click(screen.getByText('Close'));
        expect(onClose).toHaveBeenCalled();
    });

    test('calls onClose when X button is clicked', () => {
        const onClose = jest.fn();
        render(<NoPermissionsAlert isOpen={true} onClose={onClose} />);

        fireEvent.click(screen.getByLabelText('Close'));
        expect(onClose).toHaveBeenCalled();
    });
});
