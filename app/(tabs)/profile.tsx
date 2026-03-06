import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

export default function ProfileScreen() {
  const [autoCheck, setAutoCheck] = useState(false);
  const [timer, setTimer] = useState(false);
  const [hints, setHints] = useState(false);
  
  return (
    <View style={{ flex: 1, backgroundColor: '#d0d0d0' }}>
      <View style={styles.container}>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>PN</Text>
          </View>
          <View>
            <Text style={styles.username}>Player Name</Text>
            <Text style={styles.streak}>_ day streak</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text>Puzzles Completed</Text>
            <Text style={styles.statValue}>100</Text>
          </View>
          <View style={styles.stat}>
            <Text>Average Time</Text>
            <Text style={styles.statValue}>18:42</Text>
          </View>
          <View style={styles.stat}>
            <Text>Best Streak</Text>
            <Text style={styles.statValue}>23 days</Text>
          </View>
        </View>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Reset Stats</Text>
        </Pressable>
      </View>

      <View style={styles.bottomcontainer}>
        <Text style={styles.header}>Settings</Text>
        <View style={styles.stat}>
          <Text>Enable Auto-check</Text>
          <Switch 
            trackColor={{ false: '#ccc', true: '#e87756'}}
            thumbColor= '#fff'
            ios_backgroundColor="#ccc"
            onValueChange={setAutoCheck}
            value={autoCheck}
          />
        </View>
        <View style={styles.stat}>
          <Text>Enable Timer</Text>
          <Switch 
            trackColor={{ false: '#ccc', true: '#e87756'}}
            thumbColor= '#fff'
            ios_backgroundColor="#ccc"
            onValueChange={setTimer}
            value={timer}
          />
        </View>
        <View style={styles.stat}>
          <Text>Enable Hints</Text>
          <Switch 
            trackColor={{ false: '#ccc', true: '#e87756'}}
            thumbColor= '#fff'
            ios_backgroundColor="#ccc"
            onValueChange={setHints}
            value={hints}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F4D1C0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  bottomcontainer: { 
    backgroundColor: '#fff',
    justifyContent: 'center', 
    alignItems: 'stretch', 
    borderRadius: 24,
    marginBottom: 24,
    marginHorizontal: 24,
    padding: 32,
  },

  button: {
    backgroundColor: '#e87756',
    paddingVertical: 16,
    paddingHorizontal: 80,
    borderRadius: 16,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'semibold',
    fontSize: 16
  },

  container: { 
    backgroundColor: '#fff',
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 24,
    margin: 24,
    padding: 32
  },

  header: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'left',
    paddingHorizontal: 12
  },

  initials: {
    color: '#e87756',
    textAlign: 'center',
    fontSize:  24,
    fontWeight: 'bold',
  },

  stat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    width: '100%'
  },

  statsRow: {
    fontSize: 16,
    paddingBottom: 24
  },

  statValue: {
    fontWeight: 'bold'
  },

  streak: { 
    color: '#666',
  },

  username: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 20,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    justifyContent: 'flex-start',
    width: '100%'
  },

});
