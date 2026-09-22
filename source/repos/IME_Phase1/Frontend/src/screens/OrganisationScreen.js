import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import TreeNode from '../components/Treenode';
import { COLORS, SPACING } from './theme';
import institutionTree from '../data/institutionTree.json';

const OrganisationScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>
          Organisation
        </Text>

        <Text style={styles.subheading}>
          View committees and their members
        </Text>
      </View>

      <View style={styles.treeContainer}>
        <TreeNode node={institutionTree} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      COLORS?.background || '#F4F7FB',
  },

  header: {
    paddingHorizontal: SPACING?.lg || 16,
    paddingTop: SPACING?.lg || 16,
    paddingBottom: 8,
  },

  heading: {
    fontSize: 22,
    fontWeight: '800',
    color:
      COLORS?.textPrimary || '#172033',
  },

  subheading: {
    marginTop: 3,
    fontSize: 13,
    color:
      COLORS?.textSecondary || '#667085',
  },

  treeContainer: {
    flex: 1,
  },
});

export default OrganisationScreen;