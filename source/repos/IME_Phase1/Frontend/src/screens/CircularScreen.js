import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { circularService } from '../services/circularService';
import { useFocusEffect } from '@react-navigation/native';

const CircularScreen = ({ navigation }) => {
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadCirculars = async () => {
    setLoading(true);
    try {
      const response = await circularService.getAll();
      if (response.success) setCirculars(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadCirculars(); }, []);

  useFocusEffect(useCallback(() => { loadCirculars(); }, []));

  const onRefresh = () => { setRefreshing(true); loadCirculars(); };

  const deleteCircular = (id) => {
    Alert.alert('Delete Circular', 'Are you sure you want to delete this circular?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await circularService.delete(id); loadCirculars(); },
      },
    ]);
  };

  const renderCircular = ({ item }) => (
    <View style={styles.card}>
      {/* Top row: chip + Edit/Delete buttons */}
      <View style={styles.cardHeader}>
        {item.circularNumber
          ? <View style={styles.chip}><Text style={styles.chipText}>{item.circularNumber}</Text></View>
          : <View />}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('AddCircular', { item })}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteCircular(item.circularId)}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.title}>{item.title}</Text>
      {item.description ? (
        <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
      ) : null}
      <Text style={styles.date}>
        {item.publishDate ? new Date(item.publishDate).toLocaleDateString('en-IN') : ''}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {circulars.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No circulars available</Text>
        </View>
      ) : (
        <FlatList
          data={circulars}
          renderItem={renderCircular}
          keyExtractor={(item) => item.circularId.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddCircular')} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CircularScreen;

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F5F7FA' },
  list:           { padding: 12 },

  card:           { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },

  cardHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chip:           { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  chipText:       { fontSize: 11, fontWeight: '700', color: '#3B82F6', letterSpacing: 0.3 },

  actionRow:      { flexDirection: 'row', gap: 6 },
  editBtn:        { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1' },
  editText:       { fontSize: 13, color: '#334155', fontWeight: '600' },
  deleteBtn:      { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#FCA5A5' },
  deleteText:     { fontSize: 13, color: '#EF4444', fontWeight: '600' },

  title:          { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  description:    { fontSize: 13, color: '#64748B', lineHeight: 19, marginBottom: 8 },
  date:           { fontSize: 12, color: '#94A3B8' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:      { fontSize: 16, color: '#999' },

  fab:            { position: 'absolute', right: 20, bottom: 24, width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText:        { color: '#D4A017', fontSize: 24, fontWeight: '700', lineHeight: 28 },
});
