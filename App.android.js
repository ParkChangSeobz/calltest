/**
 * Sample React Native App
 *
 * adapted from App.js generated by the following command:
 *
 * react-native init example
 *
 * https://github.com/facebook/react-native
 */

import React, {Component} from 'react';
import {
  Platform,
  Button,
  StyleSheet,
  Text,
  View,
  PermissionsAndroid,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SendBirdCalls, SendBirdCallsVideo} from 'react-native-sendbird-calls';
import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  EventType,
  AndroidCategory,
} from '@notifee/react-native';

const APP_ID = 'B43226D9-E25E-476B-8455-EC1797FF6AA2';

const cameraWidth = Dimensions.get('window').width / 3;
const ratio = 1.5;

// messaging().setBackgroundMessageHandler(handleIncomingSendBirdCall);
// notifee.onBackgroundEvent(notifeeBackgroundEventHandler);

async function handleIncomingSendBirdCall(remoteMessage) {
  const {message, sendbird_call: sendbirdCall} = remoteMessage.data;

  if (sendbirdCall) {
    try {
      const call = JSON.parse(sendbirdCall);
      const {
        command: {
          payload: {call_id: callId},
          type,
        },
      } = call;

      if (callId) {
        const channelId = await notifee.createChannel({
          id: 'important',
          name: 'Important Channel',
          importance: AndroidImportance.HIGH,
        });

        if (type === 'dial') {
          // Display a notification
          await notifee.displayNotification({
            id: callId,
            title: 'SendBirdCalls',
            body: message,
            data: remoteMessage.data,
            android: {
              channelId,
              category: AndroidCategory.CALL,
              importance: AndroidImportance.HIGH,
              autoCancel: false,
              ongoing: true,
              actions: [
                {
                  title: 'DECLINE',
                  pressAction: {
                    id: 'decline',
                    launchActivity: 'default',
                  },
                },
                {
                  title: 'ACCEPT',
                  pressAction: {
                    id: 'accept',
                    launchActivity: 'default',
                  },
                },
              ],
              // smallIcon: 'ic_launcher', // optional, defaults to 'ic_launcher'.
            },
          });
        } else if (type === 'cancel') {
          await notifee.cancelNotification(callId);
        }
      }
    } catch (e) {}
  }
}

async function notifeeBackgroundEventHandler({type, detail}) {
  if (type === EventType.ACTION_PRESS) {
    const {
      notification,
      pressAction: {id},
    } = detail;
    if (id === 'accept') {
      const {sendbird_call: sendbirdCall} = notification.data;

      try {
        const call = JSON.parse(sendbirdCall);
        const {
          command: {
            payload: {call_id: callId},
          },
        } = call;
        // can't accept/decline call here, the app isn't ready yet
        // const data = await SendBirdCalls.acceptCall(callId);
        await notifee.cancelNotification(callId);
      } catch (e) {}
    } else if (id === 'decline') {
      const {sendbird_call: sendbirdCall} = notification.data;
      try {
        const call = JSON.parse(sendbirdCall);
        const {
          command: {
            payload: {call_id: callId},
          },
        } = call;
        const data = await SendBirdCalls.endCall(callId);
        await notifee.cancelNotification(callId);
      } catch (e) {}
    }
  }
}

async function notifeeForegroundEventHandler({type, detail}) {
  if (type === EventType.ACTION_PRESS) {
    const {
      notification,
      pressAction: {id},
    } = detail;
    if (id === 'accept') {
      const {sendbird_call: sendbirdCall} = notification.data;

      try {
        const call = JSON.parse(sendbirdCall);
        const {
          command: {
            payload: {call_id: callId},
          },
        } = call;
        await notifee.cancelNotification(callId);
        const data = await SendBirdCalls.acceptCall(callId);
      } catch (e) {}
    } else if (id === 'decline') {
      const {sendbird_call: sendbirdCall} = notification.data;
      try {
        const call = JSON.parse(sendbirdCall);
        const {
          command: {
            payload: {call_id: callId},
          },
        } = call;
        const data = await SendBirdCalls.endCall(callId);
        await notifee.cancelNotification(callId);
      } catch (e) {}
    }
  }
}

const requestCameraPermission = async () => {
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);
    console.log(granted);
    // if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    //   console.log('You can use the camera');
    // } else {
    //   console.log('Camera permission denied');
    // }
  } catch (err) {
    console.warn(err);
  }
};
export default class App extends Component {
  state = {
    loading: true,
  };

  getUserIdIfAny = async () => {
    const caller = await AsyncStorage.getItem('@caller');
    if (caller) {
      this.setState({caller: caller});

      await this.signIn(caller);
    }
    this.setState({loading: false});
  };

  setupSendBirdApp = async () => {
    try {
      await SendBirdCalls.setup(APP_ID);
      console.log('SendBirdCalls.setup');
      await SendBirdCalls.addDirectCallSound(
        SendBirdCalls.soundType.DIALING,
        'dialing',
      );
      await SendBirdCalls.addDirectCallSound(
        SendBirdCalls.soundType.RINGING,
        'ringing',
      );
    } catch (e) {
      console.log(e.code, e.message);
    }
  };

  appHasBeenOpenedWithNotifeeNotification = async initialNotification => {
    const {
      notification: {data: notificationData, id: notificationId},
      pressAction: {id},
    } = initialNotification;

    if (id === 'decline') {
      const {sendbird_call: sendbirdCall} = notificationData;

      try {
        const call = JSON.parse(sendbirdCall);
        const {
          command: {
            payload: {call_id: callId},
          },
        } = call;
        await notifee.cancelNotification(callId);
        const data = await SendBirdCalls.endCall(callId);
      } catch (e) {}
    }

    if (id === 'accept') {
      const {sendbird_call: sendbirdCall} = notificationData;

      try {
        const call = JSON.parse(sendbirdCall);
        const {
          command: {
            payload: {call_id: callId},
          },
        } = call;
        await notifee.cancelNotification(callId);
        const data = await SendBirdCalls.acceptCall(callId);
      } catch (e) {}
    }
  };

  async componentDidMount() {
    await this.setupSendBirdApp();
    SendBirdCalls.addEventListener(
      'SendBirdCallRinging',
      this.onSendBirdCallRinging,
    );

    SendBirdCalls.addEventListener(
      'DirectCallDidAccept',
      this.onDirectCallDidAccept,
    );

    SendBirdCalls.addEventListener(
      'DirectCallDidConnect',
      this.onDirectCallDidConnect,
    );
    SendBirdCalls.addEventListener('DirectCallDidEnd', this.onDirectCallDidEnd);

    await this.getUserIdIfAny();
    console.log('componentDidMount');
  }

  componentWillUnmount() {
    SendBirdCalls.removeAllEventListeners();
    this.unsubscribeNotifee && this.unsubscribeNotifee();
  }

  onSendBirdCallRinging = data => {
    console.log('onSendBirdCallRinging', data);
    const {callId, isVideoCall, caller} = data;
    this.setState({ringing: true, remoteUserId: caller, callId, isVideoCall});
  };

  onDirectCallDidAccept = data => {
    console.log('onDirectCallDidAccept', data);
  };
  onDirectCallDidConnect = data => {
    console.log('onDirectCallDidConnect', data);
    const {callId, isVideoCall} = data;
    this.setState({
      connected: true,
      ringing: false,
      calling: true,
      callId,
      isVideoCall,
    });
  };

  onDirectCallDidEnd = data => {
    console.log('onDirectCallDidEnd', data);
    this.setState({
      calling: false,
      ringing: false,
      callId: null,
      connected: false,
    });
  };

  call = async (callee, isVideoCall) => {
    if (!callee) {
      return false;
    }
    try {
      this.setState({loading: true});
      const data = await SendBirdCalls.dial(callee, isVideoCall);
      const {callId} = data;
      console.log('dial', data);
      this.setState({calling: true, isVideoCall, callId});
      this.setState({loading: false});
    } catch (e) {
      this.setState({loading: false});

      Alert.alert('Error', e.message);
      console.log(e.code, e.message);
    }
  };

  endCall = async () => {
    const {callId} = this.state;
    //6
    const data = await SendBirdCalls.endCall(callId);
    console.log('endcall', data);
    this.setState({calling: false, callId: null, connected: false});
  };

  signIn = async userId => {
    try {
      this.setState({loading: true});
      const result = await SendBirdCalls.authenticate(userId);
      await AsyncStorage.setItem('@caller', result.userId);
      this.setState({authenticated: true, caller: result});
      this.setState({loading: false});
      console.log('SendBirdCalls.authenticate', result);

      await requestCameraPermission();
      const token = await messaging().getToken();
      console.log('fcm', token);

      this.unsubscribeNotifee = notifee.onForegroundEvent(
        notifeeForegroundEventHandler,
      );
      messaging().onMessage(handleIncomingSendBirdCall);

      const initialNotification = await notifee.getInitialNotification();

      if (initialNotification) {
        await this.appHasBeenOpenedWithNotifeeNotification(initialNotification);
      }
    } catch (e) {
      this.setState({loading: false});

      Alert.alert('Error', e.message);
      console.log(`Error ${e.code}: ${e.message}`);
    }
  };

  logout = async () => {
    await AsyncStorage.removeItem('@caller');
    this.setState({caller: null, authenticated: false});
  };
  accept = async () => {
    const {callId} = this.state;
    notifee.cancelNotification(callId);
    const data = await SendBirdCalls.acceptCall(callId);
    this.setState({ringing: false});
  };

  decline = async () => {
    const {callId} = this.state;
    notifee.cancelNotification(callId);
    const data = await SendBirdCalls.endCall(callId);
    this.setState({ringing: false, callId: null});
  };
  render() {
    const {
      calling,
      connected,
      callId,
      isVideoCall,
      authenticated,
      caller,
      loading,
      ringing,
      remoteUserId,
    } = this.state;

    if (loading) {
      return (
        <View style={styles.container}>
          <Text style={styles.welcome}>Loading...</Text>
        </View>
      );
    }

    if (!authenticated) {
      return <NotAuthenticated onSubmitUserId={this.signIn} />;
    }

    if (ringing) {
      return (
        <View style={styles.container}>
          <Text>
            {remoteUserId} is calling (video={`${isVideoCall}`})
          </Text>
          <View style={{flexDirection: 'row'}}>
            <View style={styles.fixToText}>
              <Button title="Accept" color="blue" onPress={this.accept} />
              <Button title="Decline" color="blue" onPress={this.decline} />
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        {calling ? (
          <View style={styles.container}>
            {connected ? (
              <View style={styles.container}>
                {callId && isVideoCall ? (
                  <View style={styles.container}>
                    <SendBirdCallsVideo
                      callId={callId}
                      local={false}
                      style={{
                        flex: 1,
                        width: Dimensions.get('window').width,
                        height: Dimensions.get('window').height,
                      }}
                    />
                    <SendBirdCallsVideo
                      callId={callId}
                      local={true}
                      style={{
                        position: 'absolute',
                        top: 10,
                        width: 100,
                        height: 100,
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Text>Calling...</Text>
                      <Button title={'End call'} onPress={this.endCall} />
                    </View>
                  </View>
                ) : (
                  <View>
                    <Text>Connected (00:01...)</Text>
                    <Button title={'End call'} onPress={this.endCall} />
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.container}>
                {callId && isVideoCall ? (
                  <View style={styles.container}>
                    <SendBirdCallsVideo
                      callId={callId}
                      local={true}
                      style={{
                        flex: 1,
                        width: Dimensions.get('window').width,
                        height: Dimensions.get('window').height,
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Text>Calling...</Text>
                      <Button title={'End call'} onPress={this.endCall} />
                    </View>
                  </View>
                ) : (
                  <View style={styles.container}>
                    <Text>Calling...</Text>
                    <Button title={'End call'} onPress={this.endCall} />
                  </View>
                )}
              </View>
            )}
          </View>
        ) : (
          <CallUI caller={caller} onCall={this.call} onLogout={this.logout} />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  calling: {},
  input: {
    height: 40,
    backgroundColor: '#e2e2e2',
    marginVertical: 10,
    borderRadius: 5,
    padding: 10,
  },
  fixToText: {
    margin: 10,
    flexDirection: 'row',
    width: 200,
    justifyContent: 'space-between',
  },
});

class NotAuthenticated extends React.Component {
  state = {};
  onChangeText = value => {
    this.setState({userId: value});
  };
  signIn = () => {
    const {userId} = this.state;
    if (userId) {
      const {onSubmitUserId} = this.props;
      onSubmitUserId && onSubmitUserId(userId);
    }
  };

  render() {
    const {userId} = this.state;
    return (
      <View style={styles.container}>
        <View>
          <Text style={styles.welcome}>Authenticate</Text>
          <TextInput
            name={'userId'}
            style={styles.input}
            onChangeText={this.onChangeText}
            value={userId}
            placeholder="...SendBird User ID"
            keyboardType="numeric"
          />
          <Button title="Sign in" color="blue" onPress={this.signIn} />
        </View>
      </View>
    );
  }
}

class CallUI extends React.Component {
  state = {};
  onChangeText = text => {
    this.setState({userId: text});
  };

  render() {
    const {caller, onCall, onLogout} = this.props;
    const {userId} = this.state;

    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Signed in user: #{caller.userId} {caller.nickname}
          <Button title={`Logout #${caller.userId}`} onPress={onLogout} />
        </Text>
        <TextInput
          name={'userId'}
          style={styles.input}
          onChangeText={this.onChangeText}
          value={userId}
          placeholder="...enter User ID to call"
          keyboardType="numeric"
        />
        <View style={{flexDirection: 'row', width: '100%'}}>
          <View style={styles.fixToText}>
            <Button
              color={'green'}
              title={'Video call'}
              onPress={() => onCall(userId, true)}
            />
            <Button
              color={'blue'}
              title={'Voice call'}
              onPress={() => onCall(userId, false)}
            />
          </View>
        </View>
      </View>
    );
  }
}
