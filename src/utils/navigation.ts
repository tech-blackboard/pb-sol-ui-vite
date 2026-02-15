/**
 * Utility for window-level navigation to allow easier mocking in tests
 */
export const navigation = {
    reload: () => {
        window.location.reload();
    }
};

export const reloadPage = () => {
    navigation.reload();
};
