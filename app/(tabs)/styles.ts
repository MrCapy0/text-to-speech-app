import { StyleSheet } from 'react-native';


export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    appName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    generateButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    generateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    listContent: {
        padding: 16,
    },
    itemContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        flex: 1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    deleteIcon: {
        fontSize: 18,
        color: '#ff3b30',
    },
    menuButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    menuIcon: {
        fontSize: 20,
        color: '#666',
        fontWeight: 'bold',
    },
    expandIcon: {
        fontSize: 16,
        color: '#666',
        marginLeft: 4,
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    itemContent: {
        padding: 16,
        paddingTop: 0,
        backgroundColor: '#f9f9f9',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    itemPhrase: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
        marginBottom: 12,
    },
    editPhraseButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    editPhraseButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    editInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        fontSize: 14,
        backgroundColor: '#fff',
        marginBottom: 8,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    editButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    editButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 4,
    },
    saveButton: {
        backgroundColor: '#007AFF',
    },
    cancelButton: {
        backgroundColor: '#999',
    },
    editButtonText: {
        color: '#fff',
        fontWeight: '500',
    },
    // Name editing styles
    nameEditContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    nameEditInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        fontSize: 16,
        backgroundColor: '#fff',
        marginRight: 8,
    },
    nameEditActions: {
        flexDirection: 'row',
        gap: 4,
    },
    nameEditButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveNameButton: {
        backgroundColor: '#007AFF',
    },
    cancelNameButton: {
        backgroundColor: '#999',
    },
    nameEditButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Add button
    addButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 20,
        width: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        marginBottom: 12,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 8,
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 4,
        minWidth: 100,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: '500',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingsButton: {
        marginRight: 8,
        padding: 4,
    },
    settingsIcon: {
        fontSize: 24,
        color: '#333',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
});