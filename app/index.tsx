import { useState, useRef, useCallback } from 'react';
import { View, Text, StatusBar, TextInput, TouchableOpacity, Pressable } from 'react-native';
import "@/global.css"

export default function App() {
  const [ip, setIp] = useState('192.168.1.2');
  const [reachable, setReachable] = useState(false);
  const [angle, setAngle] = useState(90);
  const [status, setStatus] = useState('Sin verificar');

  const sendingRef = useRef(false);
  const lastSendTime = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentAngle = useRef(90);

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
    } catch {
      setReachable(false);
      setStatus('✗ Error de conexión');
    }
  }, [ip]);

  const sendAngle = useCallback(async (val: number) => {
    const now = Date.now();
    if (sendingRef.current || now - lastSendTime.current < 20) return;
    sendingRef.current = true;
    lastSendTime.current = now;
    try { await fetch(`http://${ip}/angulo?valor=${val}`); } catch {}
    sendingRef.current = false;
  }, [ip]);

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

  const stopMoving = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const angleColor =
    angle > 90 ? 'text-cyan-400' :
    angle < 90 ? 'text-rose-500' :
    'text-neutral-500';

  const borderColor =
    angle > 90 ? 'border-cyan-400' :
    angle < 90 ? 'border-rose-500' :
    'border-neutral-500';

  const dotBg =
    angle > 90 ? 'bg-cyan-400' :
    angle < 90 ? 'bg-rose-500' :
    'bg-neutral-500';

  const getDirection = () => {
    if (angle > 95) return '→ DERECHA';
    if (angle < 85) return '← IZQUIERDA';
    return '■ CENTRO';
  };

  return (
    <View className="flex-1 bg-[#0a0a0f] items-center pt-16 px-5">
      <StatusBar barStyle="light-content" />

      <Text className="text-2xl font-black text-cyan-400 tracking-[5px] mb-6">
        CAM CONTROL
      </Text>

      <View className="w-full bg-[#13131a] rounded-2xl p-4 border border-[#1e1e2e] mb-7">
        <Text className="text-neutral-600 text-[10px] tracking-[3px] mb-2">
          IP DEL ESP32
        </Text>

        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 bg-[#0d0d14] text-white rounded-xl px-4 py-2.5 border border-[#2a2a3e]"
            value={ip}
            onChangeText={(v) => { setIp(v); setReachable(false); setStatus('Sin verificar'); }}
            placeholder="192.168.1.45"
            placeholderTextColor="#555"
          />
          <TouchableOpacity
            className={`px-4 rounded-xl justify-center border ${reachable ? 'border-cyan-400 bg-[#1a1a2e]' : 'border-[#2a2a4e] bg-[#1a1a2e]'}`}
            onPress={checkConnection}
          >
            <Text className="text-cyan-400 font-bold">
              {reachable ? 'OK' : 'CHECK'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text className={`mt-2.5 ${reachable ? 'text-cyan-400' : 'text-rose-500'}`}>
          {status}
        </Text>
      </View>

      <View className="items-center mb-10">
        <Text className={`text-6xl font-black ${angleColor}`}>{angle}°</Text>
        <Text className={`text-sm font-bold ${angleColor}`}>{getDirection()}</Text>
      </View>

      <View className="flex-row items-center gap-5">

        <Pressable
          className="w-40 h-24 rounded-2xl items-center justify-center border-2 border-rose-500 bg-[#1f0a0f] active:bg-[#400010]"
          onPressIn={() => move(-2)}
          onPressOut={stopMoving}
        >
          <Text className="text-xs text-neutral-400">IZQUIERDA</Text>
          <Text className="text-3xl text-white">←</Text>
        </Pressable>

        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${borderColor}`}>
          <View className={`w-2 h-2 rounded-full ${dotBg}`} />
        </View>

        <Pressable
          className="w-40 h-24 rounded-2xl items-center justify-center border-2 border-cyan-400 bg-[#0a1a1f] active:bg-[#003040]"
          onPressIn={() => move(2)}
          onPressOut={stopMoving}
        >
          <Text className="text-3xl text-white">→</Text>
          <Text className="text-xs text-neutral-400">DERECHA</Text>
        </Pressable>

      </View>

      <Text className="text-[#2a2a3a] mt-5">Mantén presionado para mover</Text>
    </View>
  );
}