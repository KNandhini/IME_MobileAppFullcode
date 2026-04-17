import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { circularService } from '../services/circularService';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import DateTimePicker from '@react-native-community/datetimepicker';
const AddCircularScreen = ({ route, navigation }) => {

    const editData = route.params?.item;
    const [title, setTitle] = useState(editData?.title || '');
    const [description, setDescription] = useState(editData?.description || '');
    const [circularNumber, setCircularNumber] = useState(editData?.circularNumber || '');
    const [publishDate, setPublishDate] = useState(
        editData?.publishDate ? new Date(editData.publishDate) : new Date()
    );
    const [showPicker, setShowPicker] = useState(false);
    const [saving, setSaving] = useState(false);
    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    useEffect(() => {
        if (editData) {
            setTitle(editData.title || '');
            setDescription(editData.description || '');
            setCircularNumber(editData.circularNumber || '');
            setPublishDate(
                editData.publishDate ? new Date(editData.publishDate) : new Date()
            );
        }
    }, [editData]);

    const saveCircular = async () => {
        if (saving) return;

        try {
            setSaving(true);

            const data = {
                title,
                description,
                circularNumber,
                publishDate: formatDate(publishDate)  // ✅ FIXED
            };

            let response;

            if (editData) {
                response = await circularService.update(editData.circularId, data);
            } else {
                response = await circularService.create(data);
            }

            if (response?.success) {
                alert(editData ? "Updated successfully ✅" : "Created successfully ✅");
                navigation.goBack();
            }

        } catch (error) {
            console.log(error);
        } finally {
            setSaving(false);
        }
    };
    return (
        <View style={styles.container}>


            <ScrollView>

                <Text style={styles.label}>Title</Text>
                <TextInput style={styles.input} value={title} onChangeText={setTitle} />

                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, { height: 80 }]}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />

                <Text style={styles.label}>Circular Number</Text>
                <TextInput style={styles.input} value={circularNumber} onChangeText={setCircularNumber} />

                <Text style={styles.label}>Publish Date</Text>

                {/* ✅ DATE PICKER HERE */}
                <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.input}>
                    <Text>
                        {publishDate
                            ? new Date(publishDate).toLocaleDateString('en-IN')
                            : 'Select Date'}
                    </Text>
                </TouchableOpacity>

                {showPicker && (
                    <DateTimePicker
                        value={publishDate instanceof Date ? publishDate : new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowPicker(false);
                            if (selectedDate) {
                                setPublishDate(selectedDate);
                            }
                        }}
                    />
                )}
                {/* BUTTONS */}
                <View style={styles.buttonRow}>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#ccc' }]}
                        onPress={() => navigation.goBack()}
                    >
                        <Text>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            {
                                backgroundColor: saving ? '#999' : '#2196F3' // gray when loading
                            }
                        ]}
                        onPress={saveCircular}
                        disabled={saving} // ✅ disable click
                    >
                        <Text style={{ color: '#fff' }}>
                            {saving
                                ? 'Saving...'
                                : editData
                                    ? 'Update'
                                    : 'Save'}
                        </Text>
                    </TouchableOpacity>

                </View>

            </ScrollView>
        </View>
    );
};

export default AddCircularScreen;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 15
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },

    headerText: {
        fontSize: 20,
        fontWeight: 'bold'
    },

    label: {
        marginTop: 10,
        marginBottom: 5,
        fontWeight: '600'
    },

    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#fff'
    },

    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20
    },

    button: {
        padding: 8,
        borderRadius: 8,
        width: '48%',
        alignItems: 'center'
    }
});