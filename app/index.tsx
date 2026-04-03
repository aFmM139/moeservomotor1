import { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet,
  StatusBar, TextInput, TouchableOpacity,
  Pressable
} from 'react-native';

export default function App() {
  const [ip, setIp] = useState('192.168.1.2');
  const [reachable, setReachable] = useState(false);
  const [angle, setAngle] = useState(90);
  const [status, setStatus] = useState('Sin verificar');

  const sendingRef = useRef(false);
  const lastSendTime = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentAngle = useRef(90);

  // 🔌 Verificar conexión
  const checkConnection = useCallback(async () => {
    setStatus('Verificando...');
    try {
      const res = await fetch(`http://${ip}/angulo?valor=90`);
      if (res.ok) {
        setReachable(true);
        setStatus('✓ Conectado');
      } else {
        setReachable(false);
        setStatus(`✗ Status: ${res.status}`);
      }
    } catch (e) {
      setReachable(false);
      setStatus('✗ Error de conexión');
    }
  }, [ip]);

  // 📡 Enviar ángulo al ESP32
  const sendAngle = useCallback(async (val: number) => {
    const now = Date.now();
    if (sendingRef.current || now - lastSendTime.current < 20) return;

    sendingRef.current = true;
    lastSendTime.current = now;

    try {
      await fetch(`http://${ip}/angulo?valor=${val}`);
    } catch {}

    sendingRef.current = false;
  }, [ip]);

  // 🎮 Movimiento continuo (tipo joystick)
  const move = useCallback((direction: number) => {
    if (intervalRef.current) return;
  
    intervalRef.current = setInterval(() => {
      currentAngle.current += direction * 1;
  
      if (currentAngle.current > 170) currentAngle.current = 170;
      if (currentAngle.current < 10) currentAngle.current = 10;
  
      setAngle(Math.floor(currentAngle.current));
      sendAngle(Math.floor(currentAngle.current));
  
    }, 25);
  }, [sendAngle]);

  // 🛑 Detener movimiento
  const stopMoving = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 🎨 Color dinámico
  const getColor = () => {
    if (angle > 90) return '#00e5ff';
    if (angle < 90) return '#ff4466';
    return '#444';
  };

  const getDirection = () => {
    if (angle > 95) return '→ DERECHA';
    if (angle < 85) return '← IZQUIERDA';
    return '■ CENTRO';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.title}>CAM CONTROL</Text>

      {/* Conexión */}
      <View style={styles.card}>
        <Text style={styles.label}>IP DEL ESP32</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={ip}
            onChangeText={(v) => {
              setIp(v);
              setReachable(false);
              setStatus('Sin verificar');
            }}
            placeholder="192.168.1.45"
            placeholderTextColor="#555"
          />
          <TouchableOpacity
            style={[styles.btn, reachable && styles.btnConnected]}
            onPress={checkConnection}
          >
            <Text style={styles.btnText}>
              {reachable ? 'OK' : 'CHECK'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.status, reachable ? styles.statusOk : styles.statusErr]}>
          {status}
        </Text>
      </View>

      {/* Estado */}
      <View style={styles.speedBox}>
        <Text style={[styles.speedNum, { color: getColor() }]}>
          {angle}°
        </Text>
        <Text style={[styles.dirLabel, { color: getColor() }]}>
          {getDirection()}
        </Text>
      </View>

      {/* Controles */}
      <View style={styles.buttonsArea}>

        {/* Derecha */}
        <Pressable
          style={({ pressed }) => [
            styles.controlBtn,
            styles.btnAdelante,
            pressed && styles.btnAdelantePressed,
          ]}
          onPressIn={() => move(2)}
          onPressOut={stopMoving}
        >
          <Text style={styles.controlBtnIcon}>→</Text>
          <Text style={styles.controlBtnLabel}>DERECHA</Text>
        </Pressable>

        <View style={[styles.centerDot, { borderColor: getColor() }]}>
          <View style={[styles.centerDotInner, { backgroundColor: getColor() }]} />
        </View>

        {/* Izquierda */}
        <Pressable
          style={({ pressed }) => [
            styles.controlBtn,
            styles.btnReversa,
            pressed && styles.btnReversaPressed,
          ]}
          onPressIn={() => move(-2)}
          onPressOut={stopMoving}
        >
          <Text style={styles.controlBtnLabel}>IZQUIERDA</Text>
          <Text style={styles.controlBtnIcon}>←</Text>
        </Pressable>

      </View>

      <Text style={styles.hint}>Mantén presionado para mover</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0a0a0f',
    alignItems: 'center', paddingTop: 60, paddingHorizontal: 20,
  },
  title: {
    fontSize: 24, fontWeight: '900', color: '#00e5ff',
    letterSpacing: 5, marginBottom: 24,
  },
  card: {
    width: '100%', backgroundColor: '#13131a',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#1e1e2e', marginBottom: 28,
  },
  label: { color: '#444', fontSize: 10, letterSpacing: 3, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1, backgroundColor: '#0d0d14', color: '#fff',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#2a2a3e',
  },
  btn: {
    backgroundColor: '#1a1a2e', paddingHorizontal: 14,
    borderRadius: 10, justifyContent: 'center',
    borderWidth: 1, borderColor: '#2a2a4e',
  },
  btnConnected: { borderColor: '#00e5ff' },
  btnText: { color: '#00e5ff', fontWeight: '700' },
  status: { marginTop: 10 },
  statusOk: { color: '#00e5ff' },
  statusErr: { color: '#ff4466' },

  speedBox: { alignItems: 'center', marginBottom: 40 },
  speedNum: { fontSize: 60, fontWeight: '900' },
  dirLabel: { fontSize: 14, fontWeight: '700' },

  buttonsArea: { alignItems: 'center', gap: 20 },

  controlBtn: {
    width: 160, height: 90,
    borderRadius: 20, alignItems: 'center',
    justifyContent: 'center', borderWidth: 2,
  },
  btnAdelante: {
    backgroundColor: '#0a1a1f',
    borderColor: '#00e5ff',
  },
  btnAdelantePressed: {
    backgroundColor: '#003040',
  },
  btnReversa: {
    backgroundColor: '#1f0a0f',
    borderColor: '#ff4466',
  },
  btnReversaPressed: {
    backgroundColor: '#400010',
  },
  controlBtnIcon: {
    fontSize: 28, color: '#fff',
  },
  controlBtnLabel: {
    fontSize: 12, color: '#aaa',
  },

  centerDot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  centerDotInner: {
    width: 8, height: 8, borderRadius: 4,
  },

  hint: {
    color: '#2a2a3a', marginTop: 20,
  },
});