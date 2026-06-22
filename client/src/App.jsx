import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import Entrance from './screens/Entrance';
import Selfie from './screens/Selfie';
import Setup from './screens/Setup';
import RoomChoice from './screens/RoomChoice';
import Invite from './screens/Invite';
import Room from './screens/Room';
import './styles.css';

export default function App() {
  const screen = useAppStore(s => s.screen);

  // Handle invite links: /?room=ROOMID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');
    if (roomId) {
      useAppStore.getState().setInviteRoomId(roomId);
      useAppStore.getState().setScreen('selfie');
    }
  }, []);

  const screens = {
    entrance: <Entrance />,
    selfie: <Selfie />,
    setup: <Setup />,
    roomchoice: <RoomChoice />,
    invite: <Invite />,
    room: <Room />,
  };

  return screens[screen] || <Entrance />;
}
