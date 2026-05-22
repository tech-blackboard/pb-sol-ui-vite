/**
 * Utility for window-level navigation to allow easier mocking in tests
 */
export const navigation = {
    getLocation: () => window.location,
    reload: () => {
        navigation.getLocation().reload();
    }
};

export const reloadPage = () => {
    navigation.reload();
};
